import { Octokit } from "@octokit/rest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build, createServer } from "vite";
import { parse } from "yaml";
import { ConfigSchema, requireEnv } from "./config.ts";
import { generateRepository } from "./generator.ts";
import { getPrimaryForeground } from "./theme.ts";

const WORKSPACE = process.env.OPENVPM_WORKSPACE ?? process.cwd();

const CONFIG_PATH = resolve(
  WORKSPACE,
  process.env.OPENVPM_CONFIG ?? "openvpm.yaml",
);

const OUTPUT_PATH = resolve(WORKSPACE, process.env.OPENVPM_OUTPUT ?? "dist");

const ROOT_PATH = resolve(import.meta.dirname, "..");

async function main() {
  const content = await readFile(CONFIG_PATH, "utf8");
  const config = ConfigSchema.parse(parse(content));

  process.env.VITE_PRIMARY_COLOR = config.primaryColor;
  process.env.VITE_PRIMARY_FOREGROUND = getPrimaryForeground(
    config.primaryColor,
  );

  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    process.env.VITE_GITHUB_OWNER = owner;
    process.env.VITE_GITHUB_REPO = repo;
    process.env.VITE_GITHUB_REPOSITORY_URL = `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${owner}/${repo}`;
  }

  if (process.argv.includes("--dev")) {
    const server = await createServer({ root: ROOT_PATH });
    await server.listen();
    server.printUrls();
    return;
  }

  const baseUrl = requireEnv("OPENVPM_BASE_URL");
  const octokit = new Octokit({ auth: requireEnv("GITHUB_TOKEN") });

  await build({
    root: ROOT_PATH,
    base: new URL(baseUrl).pathname.replace(/\/?$/, "/"),
    build: { outDir: OUTPUT_PATH },
  });

  await generateRepository({
    config,
    octokit,
    outputPath: OUTPUT_PATH,
    baseUrl,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
