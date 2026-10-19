import type { Octokit } from "@octokit/rest";
import { posix } from "node:path";
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
