import { Octokit } from "@octokit/rest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import { ConfigSchema, requireEnv } from "./config.ts";
import { generateRepository } from "./generator.ts";

const WORKSPACE = requireEnv("OPENVPM_WORKSPACE");

const CONFIG_PATH = resolve(WORKSPACE, requireEnv("OPENVPM_CONFIG"));

const OUTPUT_PATH = resolve(WORKSPACE, requireEnv("OPENVPM_OUTPUT"));

const BASE_URL = requireEnv("OPENVPM_BASE_URL");

const GITHUB_TOKEN = requireEnv("GITHUB_TOKEN");

async function main() {
  const content = await readFile(CONFIG_PATH, "utf8");
  const config = ConfigSchema.parse(parse(content));

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  await generateRepository({
    config,
    octokit,
    outputPath: OUTPUT_PATH,
    baseUrl: BASE_URL,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
