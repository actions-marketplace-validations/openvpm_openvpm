import type { Octokit } from "@octokit/rest";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "./config.ts";
import { collectDependencies, resolveDependency } from "./dependencies.ts";
import { buildPackage, collectPackages } from "./packages.ts";
import { type VpmRepository, VpmRepositorySchema } from "./schemas.ts";

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
  const vpmPackages = (
    await Promise.all(
      config.packageSources.map((config) =>
        collectPackages({ config, octokit }),
      ),
    )
  ).flat();

  for (const vpmPackage of vpmPackages) {
    const { manifest } = vpmPackage;
    for (const upmDependency of await collectDependencies([vpmPackage])) {
      const { name, version } = upmDependency;
      if (
        !vpmPackages.some(
          ({ manifest }) =>
            manifest.name === name && manifest.version === version,
        )
      ) {
        const dependencyPackage = await resolveDependency({
          upmDependency,
          upmRegistries: config.upmRegistries,
          baseUrl,
        });
        if (!dependencyPackage) {
          throw new Error(`Unable to resolve ${name}@${version}`);
        }
        vpmPackages.push(dependencyPackage);
      }

      manifest.vpmDependencies ??= {};
      if (
        manifest.vpmDependencies[name] !== undefined &&
        manifest.vpmDependencies[name] !== version
      ) {
        throw new Error(
          `Conflicting VPM dependency ${name} in ${manifest.name}`,
        );
      }
      manifest.vpmDependencies[name] = version;
      delete manifest.dependencies?.[name];
    }
  }

  const builtPackages = await Promise.all(
    vpmPackages.map((vpmPackage) =>
      buildPackage({ vpmPackage, outputPath, baseUrl }),
    ),
  );

  const repositoryPackages: VpmRepository["packages"] = Object.create(null);
  for (const { manifest, zipSHA256 } of builtPackages) {
    const entry = (repositoryPackages[manifest.name] ??= {
      versions: Object.create(null),
    });
    entry.versions[manifest.version] = { ...manifest, zipSHA256 };
  }

  const repository = VpmRepositorySchema.parse({
    name: config.name,
    id: config.id,
    author: config.author,
    description: config.description,
    url: new URL("index.json", `${baseUrl.replace(/\/+$/, "")}/`).toString(),
    packages: repositoryPackages,
  });

  await mkdir(outputPath, { recursive: true });
  await writeFile(
    join(outputPath, "index.json"),
    `${JSON.stringify(repository, null, 2)}\n`,
  );
}
