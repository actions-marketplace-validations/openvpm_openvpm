import { z } from "zod";

/**
 * Schema for a Unity Package Manager package manifest.
 *
 * @see https://docs.unity3d.com/2022.3/Documentation/Manual/upm-manifestPkg.html
 */
export const UpmPackageManifestSchema = z
  .object({
    /** The unique identifier of the package. */
    name: z.string().min(1),

    /** The version of the package. */
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

    /** The license of the package. */
    license: z.string().optional(),

    /** The minimum supported Unity Editor version. */
    unity: z.string().optional(),

    /** The required Unity Editor release. */
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

    /** The type of the package. */
    type: z.string().optional(),
  })
  .catchall(z.unknown());

/**
 * Schema for package metadata returned by a Unity Package Manager registry.
 *
 * @see https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md
 */
export const UpmPackageMetadataSchema = z.object({
  /** The unique identifier of the package. */
  name: z.string().min(1),

  /** The available package versions and their metadata. */
  versions: z.record(
    z.string(),
    z.object({
      /** The unique identifier of the package. */
      name: z.string().min(1),

      /** The version of the package. */
      version: z.string().min(1),

      /** Distribution information for the package archive. */
      dist: z.object({
        /** The URL of the package tarball. */
        tarball: z.url(),

        /** The SHA-1 checksum of the package tarball. */
        shasum: z.string().optional(),

        /** The integrity hash of the package tarball. */
        integrity: z.string().optional(),
      }),
    }),
  ),

  /** Tags mapped to package versions. */
  "dist-tags": z.record(z.string(), z.string()).optional(),
});

/**
 * Schema for a VRChat Package Manager package manifest.
 *
 * @see https://vcc.docs.vrchat.com/vpm/packages/
 */
export const VpmPackageManifestSchema = UpmPackageManifestSchema.extend({
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

  /** The URL of the package ZIP archive. */
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
 * Schema for a VRChat Package Manager repository index.
 *
 * @see https://vcc.docs.vrchat.com/vpm/repos/
 */
export const VpmRepositorySchema = z.object({
  /** The name of the repository. */
  name: z.string().min(1),

  /** The unique identifier of the repository. */
  id: z.string().min(1),

  /** The URL of the repository index. */
  url: z.url(),

  /** The author of the repository. */
  author: z.string().min(1),

  /** A description of the repository. */
  description: z.string().optional(),

  /** The packages available in the repository. */
  packages: z.record(
    z.string(),
    z.object({
      /** The available versions of the package. */
      versions: z.record(
        z.string(),
        VpmPackageManifestSchema.extend({
          /** The SHA-256 checksum of the package ZIP archive. */
          zipSHA256: z
            .string()
            .regex(/^[a-fA-F0-9]{64}$/)
            .optional(),
        }),
      ),
    }),
  ),
});

export type UpmPackageManifest = z.infer<typeof UpmPackageManifestSchema>;

export type UpmPackageMetadata = z.infer<typeof UpmPackageMetadataSchema>;

export type VpmPackageManifest = z.infer<typeof VpmPackageManifestSchema>;

export type VpmRepository = z.infer<typeof VpmRepositorySchema>;
