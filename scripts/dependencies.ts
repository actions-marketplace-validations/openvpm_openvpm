import { strFromU8, type Unzipped } from "fflate";
import { createHash } from "node:crypto";
import { Parser } from "tar";
import {
  UpmPackageManifestSchema,
  type UpmPackageMetadata,
  UpmPackageMetadataSchema,
  VpmPackageManifestSchema,
} from "../schemas.ts";
import type { UpmRegistryConfig } from "./config.ts";
import type { VpmPackage } from "./packages.ts";

const BUILTIN_UPM_REGISTRY = "https://packages.unity.com";

// Core packages ship with the Editor and may be absent from the registry.
// https://docs.unity3d.com/ja/2023.1/Manual/pack-core.html
const CORE_UPM_PACKAGES = new Set([
  "com.unity.2d.sprite",
  "com.unity.2d.tilemap",
  "com.unity.render-pipelines.core",
  "com.unity.render-pipelines.high-definition",
  "com.unity.render-pipelines.universal",
  "com.unity.shadergraph",
  "com.unity.ugui",
  "com.unity.visualeffectgraph",
]);

/**
 * Represents a Unity Package Manager dependency to be resolved from a package registry.
 */
export type UpmDependency = {
  /** The name of the dependency package. */
  name: string;

  /** The requested version of the dependency package. */
  version: string;
};

/**
 * Collects unique UPM dependencies that are unavailable from the Unity registry.
 *
 * @param vpmPackages - The packages to collect dependencies from.
 * @returns The dependencies requiring external registry resolution.
 */
export async function collectDependencies(
  vpmPackages: VpmPackage[],
): Promise<UpmDependency[]> {
  const dependencies: UpmDependency[] = [
    ...new Map(
      vpmPackages.flatMap((vpmPackage) =>
        Object.entries(vpmPackage.manifest.dependencies ?? {}).map(
          ([name, version]) => [`${name}@${version}`, { name, version }],
        ),
      ),
    ).values(),
  ];

  const results = await Promise.all(
    dependencies.map(async (dependency) => {
      if (
        dependency.name.startsWith("com.unity.modules.") ||
        CORE_UPM_PACKAGES.has(dependency.name)
      ) {
        return null;
      }

      const metadata = await fetchUpmPackageMetadata(
        BUILTIN_UPM_REGISTRY,
        dependency.name,
      );

      if (!metadata) {
        return dependency;
      }

      return Object.hasOwn(metadata.versions, dependency.version)
        ? null
        : dependency;
    }),
  );

  return results.filter(
    (dependency): dependency is UpmDependency => dependency !== null,
  );
}

/**
 * Resolves a UPM dependency from external registries and converts it to a VPM package.
 *
 * @param options - The options for resolving the dependency.
 * @param options.upmDependency - The dependency to resolve.
 * @param options.upmRegistries - The external UPM registries to search.
 * @param options.baseUrl - The public base URL of the VPM repository.
 * @returns The converted VPM package, or null if not found.
 */
export async function resolveDependency({
  upmDependency,
  upmRegistries,
  baseUrl,
}: {
  upmDependency: UpmDependency;
  upmRegistries: UpmRegistryConfig[];
  baseUrl: string;
}): Promise<VpmPackage | null> {
  for (const upmRegistry of upmRegistries) {
    const metadata = await fetchUpmPackageMetadata(
      upmRegistry.url,
      upmDependency.name,
    );

    const distribution =
      metadata && Object.hasOwn(metadata.versions, upmDependency.version)
        ? metadata.versions[upmDependency.version].dist
        : undefined;

    if (!distribution) {
      continue;
    }

    const response = await fetch(distribution.tarball);

    if (!response.ok) {
      throw new Error(
        `Failed to download UPM package with status ${response.status}: ${upmDependency.name}@${upmDependency.version}`,
      );
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    const integrity = distribution.integrity?.match(
      /(?:^|\s)(sha512|sha384|sha256|sha1)-([A-Za-z0-9+/=]+)/,
    );

    if (distribution.integrity && !integrity) {
      throw new Error(
        `Unsupported UPM package integrity: ${upmDependency.name}@${upmDependency.version}`,
      );
    }

    if (!integrity && !distribution.shasum) {
      throw new Error(
        `Missing UPM package checksum: ${upmDependency.name}@${upmDependency.version}`,
      );
    }

    const algorithm = integrity?.[1] ?? "sha1";
    const expected = integrity?.[2] ?? distribution.shasum;
    const actual = createHash(algorithm)
      .update(bytes)
      .digest(integrity ? "base64" : "hex");

    if (actual !== expected) {
      throw new Error(
        `UPM package checksum mismatch: ${upmDependency.name}@${upmDependency.version}`,
      );
    }

    const files = await extractTarball(bytes);
    const manifestFile = files["package.json"];
    const { name, version } = upmDependency;
    if (!manifestFile) {
      throw new Error(`Package manifest not found: ${name}@${version}`);
    }

    const manifest = UpmPackageManifestSchema.parse(
      JSON.parse(strFromU8(manifestFile)),
    );
    if (manifest.name !== name || manifest.version !== version) {
      throw new Error(`Package manifest does not match ${name}@${version}`);
    }
    delete files["package.json"];

    const author =
      typeof manifest.author === "string"
        ? { name: manifest.author || name }
        : (manifest.author ?? { name });
    const email = author.email ?? "unknown@example.invalid";
    if (!author.email) {
      console.warn(
        `UPM -> VPM: ${name}@${version} is missing author.email; using dummy address ${email}`,
      );
    }

    return {
      manifest: VpmPackageManifestSchema.parse({
        ...manifest,
        displayName: manifest.displayName || name,
        author: { ...author, email },
        url: new URL(
          `packages/${encodeURIComponent(`${name}-${version}.zip`)}`,
          `${baseUrl.replace(/\/+$/, "")}/`,
        ).toString(),
      }),
      files,
    };
  }

  return null;
}

/**
 * Fetches package metadata from a UPM registry.
 *
 * @param registryUrl - The URL of the UPM registry.
 * @param name - The name of the package.
 * @returns The package metadata, or null if not found.
 * @throws {Error} If the registry request fails.
 */
async function fetchUpmPackageMetadata(
  registryUrl: string,
  name: string,
): Promise<UpmPackageMetadata | null> {
  const url = new URL(
    encodeURIComponent(name),
    `${registryUrl.replace(/\/+$/, "")}/`,
  );

  const response = await fetch(url);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch UPM metadata with status ${response.status}: ${url}`,
    );
  }
  return UpmPackageMetadataSchema.parse(await response.json());
}

/**
 * Extracts files from a UPM tarball, removing the package/ prefix.
 *
 * @param bytes - The contents of the tarball.
 * @returns The extracted files with paths relative to the package root.
 * @throws {Error} If the archive is invalid or contains unsupported entries.
 */
async function extractTarball(bytes: Buffer): Promise<Unzipped> {
  const files: Unzipped = Object.create(null);
  await new Promise<void>((resolve, reject) => {
    const parser = new Parser({
      strict: true,
      onReadEntry(entry) {
        const path = entry.path.replace(/^\.\//, "");
        if (entry.type === "Directory") {
          entry.resume();
          return;
        }
        if (
          (entry.type !== "File" && entry.type !== "OldFile") ||
          !path.startsWith("package/") ||
          path.split("/").some((part) => part === ".." || part === "") ||
          path.includes("\\")
        ) {
          parser.abort(
            new Error(`Unsupported package archive entry: ${entry.path}`),
          );
          return;
        }
        const chunks: Buffer[] = [];
        entry.on("data", (chunk: Buffer) => chunks.push(chunk));
        entry.on("error", reject);
        entry.on("end", () => {
          files[path.slice("package/".length)] = Buffer.concat(chunks);
        });
      },
    });
    parser.on("error", reject);
    parser.on("end", resolve);
    parser.end(bytes);
  });
  return files;
}
