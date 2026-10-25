import { z } from "zod";

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

  /** The pattern used to identify package ZIP assets. */
  assetPattern: z.string().default("*.zip"),
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

  /** The primary UI color in #RGB or #RRGGBB format. */
  primaryColor: z
    .string()
    .regex(/^#(?:[\da-f]{3}|[\da-f]{6})$/i)
    .default("#08BDBB"),

  /** UPM registries used to resolve and redistribute dependencies. */
  upmRegistries: z.array(UpmRegistryConfigSchema).default([]),

  /** Package sources included in the VPM repository. */
  packageSources: z.array(PackageSourceConfigSchema).default([]),
});

export type UpmRegistryConfig = z.infer<typeof UpmRegistryConfigSchema>;

export type PackageSourceConfig = z.infer<typeof PackageSourceConfigSchema>;

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Retrieves a required environment variable.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable.
 * @throws {Error} If the environment variable is missing or empty.
 */
export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
