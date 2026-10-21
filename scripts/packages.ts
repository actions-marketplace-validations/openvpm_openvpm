import type { Octokit } from "@octokit/rest";
import { strFromU8, strToU8, type Unzipped, unzipSync, zipSync } from "fflate";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, matchesGlob } from "node:path";
import { URL } from "node:url";
import type { PackageSourceConfig } from "./config.ts";
import {
  type VpmPackageManifest,
  VpmPackageManifestSchema,
} from "./schemas.ts";

const PACKAGE_MANIFEST_FILENAME = "package.json";

/**
 * Represents a VRChat Package Manager package with its manifest and files.
 */
export type VpmPackage = {
  /** The package manifest. */
  manifest: VpmPackageManifest;

  /** The extracted package files excluding the manifest. */
  files: Unzipped;
};

/**
 * Collects packages from GitHub Releases matching the given configuration.
 *
 * @param options - The options for collecting packages.
 * @param options.config - The configuration defining the GitHub repository and asset pattern.
 * @param options.octokit - The Octokit client used to access GitHub.
 * @returns The collected packages with their manifests and extracted files.
 */
export async function collectPackages({
  config,
  octokit,
}: {
  config: PackageSourceConfig;
  octokit: Octokit;
}): Promise<VpmPackage[]> {
  const [owner, repo] = config.name.split("/");

  const releases = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100,
  });

  const assets = releases
    .filter((release) => !release.draft && !release.prerelease)
    .flatMap((release) =>
      release.assets.filter(
        (asset) =>
          asset.state === "uploaded" &&
          matchesGlob(asset.name, config.assetPattern),
      ),
    );

  return Promise.all(
    assets.map(async (asset): Promise<VpmPackage> => {
      const { data } = await octokit.rest.repos.getReleaseAsset({
        owner,
        repo,
        asset_id: asset.id,
        headers: {
          accept: "application/octet-stream",
        },
      });

      if (!(data instanceof ArrayBuffer)) {
        throw new Error(
          `Expected binary release asset: ${config.name}/${asset.name}`,
        );
      }

      const bytes = new Uint8Array(data);
      const files = unzipSync(bytes);

      const manifestFile = files[PACKAGE_MANIFEST_FILENAME];

      if (!manifestFile) {
        throw new Error(
          `Package manifest not found: ${config.name}/${asset.name}`,
        );
      }

      const manifest = VpmPackageManifestSchema.parse({
        ...JSON.parse(strFromU8(manifestFile)),
        url: asset.browser_download_url,
      });

      delete files[PACKAGE_MANIFEST_FILENAME];

      return { manifest, files };
    }),
  );
}

/**
 * Builds and writes a package archive.
 *
 * @param options - The options for building the package.
 * @param options.vpmPackage - The package to build.
 * @param options.outputPath - The directory where the package will be written.
 * @param options.baseUrl - The public base URL of the VPM repository.
 * @returns The built package manifest and ZIP checksum.
 */
export async function buildPackage({
  vpmPackage,
  outputPath,
  baseUrl,
}: {
  vpmPackage: VpmPackage;
  outputPath: string;
  baseUrl: string;
}) {
  const filename = `${vpmPackage.manifest.name}-${vpmPackage.manifest.version}.zip`;

  const url = new URL(
    `packages/${encodeURIComponent(filename)}`,
    `${baseUrl.replace(/\/+$/, "")}/`,
  ).toString();

  const manifest = VpmPackageManifestSchema.parse({
    ...vpmPackage.manifest,
    url,
  });

  const bytes = zipSync({
    ...vpmPackage.files,
    [PACKAGE_MANIFEST_FILENAME]: strToU8(
      `${JSON.stringify(manifest, null, 2)}\n`,
    ),
  });

  const zipSHA256 = createHash("sha256").update(bytes).digest("hex");

  const directory = join(outputPath, "packages");

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), bytes);

  return { manifest, zipSHA256 };
}
