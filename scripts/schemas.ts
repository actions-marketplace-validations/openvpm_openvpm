import { z } from "zod";

/**
 * Describes a package compatible with the Unity Package Manager.
 *
 * @see https://docs.unity3d.com/2022.3/Documentation/Manual/upm-manifestPkg.html
 */
export const UnityPackageManifestSchema = z
  .object({
    /** Unique package identifier in reverse domain name notation. */
    name: z.string().min(1),

    /** Package version following Semantic Versioning. */
    version: z.string().min(1),

    /** Human-readable name displayed in the Unity Editor. */
    displayName: z.string().optional(),

    /** Description of the package and its functionality. */
    description: z.string().optional(),

    /** Information about the package author. */
    author: z
      .union([
        z.string(),
        z
          .object({
            /** Name of the package author. */
            name: z.string().min(1),

            /** Email address of the package author. */
            email: z.email().optional(),

            /** Website of the package author. */
            url: z.url().optional(),
          })
          .catchall(z.unknown()),
      ])
      .optional(),

    /** Keywords used to discover the package. */
    keywords: z.array(z.string()).optional(),

    /** License identifier or license information. */
    license: z.string().optional(),

    /** Minimum compatible Unity Editor version. */
    unity: z.string().optional(),

    /** Specific Unity Editor release required by the package. */
    unityRelease: z.string().optional(),

    /** Dependencies managed by the Unity Package Manager. */
    dependencies: z.record(z.string(), z.string()).optional(),

    /** URL of the package documentation. */
    documentationUrl: z.url().optional(),

    /** URL of the package changelog. */
    changelogUrl: z.url().optional(),

    /** URL of the package license information. */
    licensesUrl: z.url().optional(),

    /** Sample assets that can be imported into a Unity project. */
    samples: z
      .array(
        z
          .object({
            /** Human-readable name of the sample. */
            displayName: z.string().min(1),

            /** Description of the sample. */
            description: z.string(),

            /** Path to the sample directory within the package. */
            path: z.string().min(1),
          })
          .catchall(z.unknown()),
      )
      .optional(),

    /** Whether package assets are hidden in the Unity Editor. */
    hideInEditor: z.boolean().optional(),

    /** Package type reserved for internal Unity use. */
    type: z.string().optional(),
  })
  .catchall(z.unknown());

/**
 * Describes a package compatible with the VRChat Package Manager.
 *
 * @see https://vcc.docs.vrchat.com/vpm/packages
 */
export const VRChatPackageManifestSchema = UnityPackageManifestSchema.extend({
  /** Human-readable name displayed in the Creator Companion. */
  displayName: z.string().min(1),

  /** Information about the package author. */
  author: z
    .object({
      /** Name of the package author. */
      name: z.string().min(1),

      /** Email address of the package author. */
      email: z.email(),

      /** Website of the package author. */
      url: z.url().optional(),
    })
    .catchall(z.unknown()),

  /** Direct download URL of the package ZIP archive. */
  url: z.url(),

  /** Dependencies managed by the VRChat Package Manager. */
  vpmDependencies: z.record(z.string(), z.string()).optional(),

  /** Legacy directories to remove when installing the package. */
  legacyFolders: z.record(z.string(), z.string()).optional(),

  /** Legacy files to remove when installing the package. */
  legacyFiles: z.record(z.string(), z.string()).optional(),

  /** Legacy packages to remove when installing the package. */
  legacyPackages: z.array(z.string()).optional(),
});

export type UnityPackageManifest = z.infer<typeof UnityPackageManifestSchema>;

export type VRChatPackageManifest = z.infer<typeof VRChatPackageManifestSchema>;
