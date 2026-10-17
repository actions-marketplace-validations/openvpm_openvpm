import { z } from "zod";

/**
 * Schema for a Unity Package Manager package manifest.
 *
 * @see https://docs.unity3d.com/2022.3/Documentation/Manual/upm-manifestPkg.html
 */
export const UnityPackageManifestSchema = z
  .object({
    /** The unique identifier of the package. */
    name: z.string().min(1),

    /** The package version, following Semantic Versioning. */
    version: z.string().min(1),

    /** The name displayed in the Unity Editor. */
    displayName: z.string().optional(),

    /** A description of the package. */
    description: z.string().optional(),

    /** Information about the package author. */
    author: z
      .union([
        z.string(),
        z
          .object({
            /** The author's name. */
            name: z.string().min(1),

            /** The author's email address. */
            email: z.email().optional(),

            /** The URL of the author's website. */
            url: z.url().optional(),
          })
          .catchall(z.unknown()),
      ])
      .optional(),

    /** Keywords used to discover the package. */
    keywords: z.array(z.string()).optional(),

    /** The package license. */
    license: z.string().optional(),

    /** The minimum supported Unity Editor version. */
    unity: z.string().optional(),

    /** The specific Unity Editor release required by the package. */
    unityRelease: z.string().optional(),

    /** Dependencies managed by Unity Package Manager. */
    dependencies: z.record(z.string(), z.string()).optional(),

    /** The URL of the package documentation. */
    documentationUrl: z.url().optional(),

    /** The URL of the package changelog. */
    changelogUrl: z.url().optional(),

    /** The URL of the package license information. */
    licensesUrl: z.url().optional(),

    /** Samples that can be imported into a Unity project. */
    samples: z
      .array(
        z
          .object({
            /** The name displayed for the sample. */
            displayName: z.string().min(1),

            /** A description of the sample. */
            description: z.string(),

            /** The path to the sample directory. */
            path: z.string().min(1),
          })
          .catchall(z.unknown()),
      )
      .optional(),

    /** Whether package assets are hidden in the Unity Editor. */
    hideInEditor: z.boolean().optional(),

    /** The package type used internally by Unity. */
    type: z.string().optional(),
  })
  .catchall(z.unknown());

/**
 * Schema for a VRChat Package Manager package manifest.
 */
export const VRChatPackageManifestSchema = UnityPackageManifestSchema.extend({
  /** The name displayed in the VRChat Creator Companion. */
  displayName: z.string().min(1),

  /** Information about the package author. */
  author: z
    .object({
      /** The author's name. */
      name: z.string().min(1),

      /** The author's email address. */
      email: z.email(),

      /** The URL of the author's website. */
      url: z.url().optional(),
    })
    .catchall(z.unknown()),

  /** The URL for downloading the package ZIP archive. */
  url: z.url(),

  /** Dependencies managed by VRChat Package Manager. */
  vpmDependencies: z.record(z.string(), z.string()).optional(),

  /** Legacy directories to remove during installation. */
  legacyFolders: z.record(z.string(), z.string()).optional(),

  /** Legacy files to remove during installation. */
  legacyFiles: z.record(z.string(), z.string()).optional(),

  /** Legacy packages to remove during installation. */
  legacyPackages: z.array(z.string()).optional(),
});

/**
 * Schema for an external UPM registry configuration.
 */
export const UpmRegistryConfigSchema = z.strictObject({
  /** The name of the registry. */
  name: z.string().min(1),

  /** The URL of the registry. */
  url: z.url(),
});

/**
 * Schema for package source configuration.
 */
export const PackageSourceConfigSchema = z.strictObject({
  /** The GitHub repository in owner/repository format. */
  name: z.string().regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/),

  /** The path to the directory containing the package manifest. */
  path: z.string().min(1).default("."),

  /** The regular expression used to match tags and extract versions. */
  tagPattern: z
    .string()
    .min(1)
    .refine(
      (value) => {
        try {
          new RegExp(value);
          return value.includes("(?<version>");
        } catch {
          return false;
        }
      },
      {
        error:
          "Must be a valid regular expression with a named 'version' capture group.",
      },
    )
    .default(
      String.raw`^v(?<version>\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$`,
    ),
});

/**
 * Schema for an OpenVPM configuration.
 */
export const ConfigSchema = z.strictObject({
  /** The name of the VPM repository. */
  name: z.string().min(1),

  /** The unique identifier of the VPM repository. */
  id: z.string().min(1),

  /** The author of the VPM repository. */
  author: z.string().min(1),

  /** A description of the VPM repository. */
  description: z.string().optional(),

  /** UPM registries used to resolve and redistribute dependencies. */
  upmRegistries: z.array(UpmRegistryConfigSchema).default([]),

  /** Package sources included in the VPM repository. */
  packageSources: z.array(PackageSourceConfigSchema).default([]),
});

export type UnityPackageManifest = z.infer<typeof UnityPackageManifestSchema>;

export type VRChatPackageManifest = z.infer<typeof VRChatPackageManifestSchema>;

export type UpmRegistryConfig = z.infer<typeof UpmRegistryConfigSchema>;

export type PackageSourceConfig = z.infer<typeof PackageSourceConfigSchema>;

export type Config = z.infer<typeof ConfigSchema>;
