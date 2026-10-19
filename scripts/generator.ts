import type { Octokit } from "@octokit/rest";
import { collectPackageSources, type PackageSource } from "./packages.ts";
import { type Config } from "./schemas.ts";

export async function generateRepository({
  config,
  octokit,
  outputPath,
  baseUrl,
}: {
  config: Config;
  octokit: Octokit;
  outputPath: string;
  baseUrl: string;
}) {
  console.log("Output path:", outputPath);
  console.log("Base URL:", baseUrl);

  const packageSources: PackageSource[] = [];

  for (const packageSourceConfig of config.packageSources) {
    packageSources.push(
      ...(await collectPackageSources({
        config: packageSourceConfig,
        octokit,
      })),
    );
  }

  console.log("Collected package sources:", packageSources.length);

  // TODO: Generate the VPM repository.
}
