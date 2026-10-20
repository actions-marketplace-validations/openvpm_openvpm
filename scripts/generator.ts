import type { Octokit } from "@octokit/rest";
import {
  buildPackage,
  collectSources,
  type PackageSource,
} from "./packages.ts";
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
  const packageSources: PackageSource[] = (
    await Promise.all(
      config.packageSources.map((config) =>
        collectSources({ config, octokit }),
      ),
    )
  ).flat();

  for (const packageSource of packageSources) {
    await buildPackage({
      source: packageSource,
      octokit,
      outputPath,
      baseUrl,
    });
  }

  // TODO: Generate the VPM repository.
}
