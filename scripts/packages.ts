import type { Octokit } from "@octokit/rest";
import { strToU8, unzipSync, zipSync } from "fflate";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, posix } from "node:path";
import { URL } from "node:url";
import {
  type PackageSourceConfig,
  type VRChatPackageManifest,
  VRChatPackageManifestSchema,
} from "./schemas.ts";

/**
 * Represents a package source resolved to a specific Git commit and its manifest.
 */
export type PackageSource = PackageSourceConfig & {
  /** The Git commit SHA associated with the tag. */
  sha: string;

  /** The original VRChat package manifest. */
  manifest: VRChatPackageManifest;
};

/**
 * Collects package sources matching the given configuration.
 *
 * @param options - The options for collecting package sources.
 * @param options.config - The configuration defining the GitHub repository, package path, and tag pattern.
 * @param options.octokit - The Octokit client used to access GitHub.
 * @returns The collected package sources with their commit SHAs and validated manifests.
 */
export async function collectPackageSources({
  config,
  octokit,
}: {
  config: PackageSourceConfig;
  octokit: Octokit;
}): Promise<PackageSource[]> {
  const packageSources: PackageSource[] = [];
  const versions = new Set<string>();

  const [owner, repo] = config.name.split("/");
  const path = posix.join(config.path, "package.json");
  const pattern = new RegExp(config.tagPattern);

  const tags = await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo,
    per_page: 100,
  });

  for (const tag of tags) {
    const match = pattern.exec(tag.name);

    if (!match) {
      continue;
    }

    const version = match.groups?.version;

    if (!version) {
      throw new Error(
        `Cannot extract package version: ${config.name}/${path} (tag: ${tag.name})`,
      );
    }

    if (versions.has(version)) {
      throw new Error(
        `Duplicate package version "${version}": ${config.name}/${path} (tag: ${tag.name})`,
      );
    }

    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: tag.commit.sha,
    });

    if (!("content" in data) || data.encoding !== "base64") {
      throw new Error(
        `Expected Base64-encoded package manifest: ${config.name}/${path} (tag: ${tag.name})`,
      );
    }

    const content = Buffer.from(data.content, "base64").toString("utf8");
    const manifest = VRChatPackageManifestSchema.parse(JSON.parse(content));

    if (manifest.version !== version) {
      console.warn(
        `Skipping package version mismatch (expected "${version}", received "${manifest.version}"): ${config.name}/${path} (tag: ${tag.name})`,
      );
      continue;
    }

    packageSources.push({
      ...config,
      sha: tag.commit.sha,
      manifest,
    });

    versions.add(version);
  }

  return packageSources;
}

/**
 * Builds a VPM package from the given package source.
 *
 * @param options - The options for building the package.
 * @param options.source - The package source to build.
 * @param options.octokit - The Octokit client used to access GitHub.
 * @param options.outputPath - The directory where the package will be written.
 * @param options.baseUrl - The public base URL of the VPM repository.
 * @returns The built package manifest and its ZIP checksum.
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
}): Promise<{ manifest: VRChatPackageManifest; zipSHA256: string }> {
  const [owner, repo] = source.name.split("/");

  const { data } = await octokit.rest.repos.downloadZipballArchive({
    owner,
    repo,
    ref: source.sha,
  });

  const repositoryFiles = unzipSync(new Uint8Array(data as ArrayBuffer));
  const archiveRoot = Object.keys(repositoryFiles)[0]?.split("/")[0];

  if (!archiveRoot) {
    throw new Error(`Empty repository archive: ${source.name}`);
  }

  const packagePath = posix.normalize(source.path);

  if (
    posix.isAbsolute(packagePath) ||
    packagePath === ".." ||
    packagePath.startsWith("../")
  ) {
    throw new Error(`Invalid package path: ${source.name}/${source.path}`);
  }

  const packagePrefix = `${posix.join(archiveRoot, packagePath)}/`;
  const packageFiles: Record<string, Uint8Array> = Object.create(null);

  for (const [filePath, content] of Object.entries(repositoryFiles)) {
    if (!filePath.startsWith(packagePrefix)) {
      continue;
    }

    const relativePath = filePath.slice(packagePrefix.length);

    if (
      !relativePath ||
      relativePath.endsWith("/") ||
      relativePath.split("/").includes("..")
    ) {
      continue;
    }

    packageFiles[relativePath] = content;
  }

  if (!packageFiles["package.json"]) {
    throw new Error(
      `Package manifest not found: ${source.name}/${source.path}`,
    );
  }

  const filename = `${source.manifest.name}-${source.manifest.version}.zip`;

  const url = new URL(
    `packages/${encodeURIComponent(filename)}`,
    `${baseUrl.replace(/\/+$/, "")}`,
  ).toString();

  const manifest = VRChatPackageManifestSchema.parse({
    ...source.manifest,
    url,
  });

  packageFiles["package.json"] = strToU8(
    JSON.stringify(manifest, null, 2) + "\n",
  );

  const archive = zipSync(packageFiles);
  const zipSHA256 = createHash("sha256").update(archive).digest("hex");

  const directory = join(outputPath, "packages");

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), archive);

  return { manifest, zipSHA256 };
}
