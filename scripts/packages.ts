import type { components } from "@octokit/openapi-types";
import type { Octokit } from "@octokit/rest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, matchesGlob } from "node:path";
import { URL } from "node:url";
import {
  type PackageSourceConfig,
  VRChatPackageManifestSchema,
} from "./schemas.ts";

/**
 * Represents a package source resolved to a GitHub Release asset.
 */
export type PackageSource = PackageSourceConfig & {
  /** The GitHub Release tag name. */
  tag: string;

  /** The GitHub Release asset. */
  asset: components["schemas"]["release-asset"];
};

/**
 * Collects package sources from GitHub Releases matching the given configuration.
 *
 * @param options - The options for collecting package sources.
 * @param options.config - The configuration defining the GitHub repository and asset pattern.
 * @param options.octokit - The Octokit client used to access GitHub.
 * @returns The collected package sources.
 */
export async function collectSources({
  config,
  octokit,
}: {
  config: PackageSourceConfig;
  octokit: Octokit;
}): Promise<PackageSource[]> {
  const { owner, repo } = parseRepositoryName(config.name);

  const releases = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100,
  });

  return releases
    .filter((release) => !release.draft && !release.prerelease)
    .flatMap((release) =>
      release.assets
        .filter(
          (asset) =>
            asset.state === "uploaded" &&
            matchesGlob(asset.name, config.assetPattern),
        )
        .map((asset) => ({
          ...config,
          tag: release.tag_name,
          asset,
        })),
    );
}

/**
 * Builds a VPM package from a GitHub Release asset.
 *
 * @param options - The options for building the package.
 * @param options.source - The package source containing the GitHub Release asset.
 * @param options.octokit - The Octokit client used to access GitHub.
 * @param options.outputPath - The directory where the package will be written.
 * @param options.baseUrl - The public base URL of the VPM repository.
 */
export async function buildPackage({
  source,
  octokit,
  outputPath,
  baseUrl,
}: {
  source: PackageSource;
  octokit: Octokit;
  outputPath: string;
  baseUrl: string;
}) {
  const { owner, repo } = parseRepositoryName(source.name);

  const { data } = await octokit.rest.repos.getReleaseAsset({
    owner,
    repo,
    asset_id: source.asset.id,
    headers: {
      accept: "application/octet-stream",
    },
  });

  if (!(data instanceof ArrayBuffer)) {
    throw new Error(
      `Expected binary release asset: ${source.name}/${source.asset.name} (tag: ${source.tag})`,
    );
  }

  const archive = new Uint8Array(data);
  const files = unzipSync(archive);

  const manifestContent = files["package.json"];

  if (!manifestContent) {
    throw new Error(
      `Package manifest not found: ${source.name}/${source.asset.name} (tag: ${source.tag})`,
    );
  }

  const sourceManifest = VRChatPackageManifestSchema.parse(
    JSON.parse(strFromU8(manifestContent)),
  );

  const filename = `${sourceManifest.name}-${sourceManifest.version}.zip`;

  const url = new URL(
    `packages/${encodeURIComponent(filename)}`,
    `${baseUrl.replace(/\/+$/, "")}/`,
  ).toString();

  const manifest = VRChatPackageManifestSchema.parse({
    ...sourceManifest,
    url,
  });

  // TODO: Resolve external UPM dependencies.

  files["package.json"] = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);

  const packageArchive = zipSync(files);
  const zipSHA256 = createHash("sha256").update(packageArchive).digest("hex");

  const packageDirectory = join(outputPath, "packages");

  await mkdir(packageDirectory, { recursive: true });
  await writeFile(join(packageDirectory, filename), packageArchive);

  return { manifest, zipSHA256 };
}

/**
 * Parses a GitHub repository name into its owner and repository name.
 *
 * @param name - The repository name in owner/repo format.
 * @returns The repository owner and name.
 */
function parseRepositoryName(name: string): { owner: string; repo: string } {
  const [owner, repo] = name.split("/");
  return { owner, repo };
}
