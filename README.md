<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".art/logo-white.svg">
    <img src=".art/logo-black.svg" alt="OpenVPM" width="320">
  </picture>
</p>

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-2088FF?style=flat&logo=githubactions&logoColor=white)](action.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-08BDBB?style=flat)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/openvpm/openvpm?style=flat&include_prereleases)](https://github.com/openvpm/openvpm/releases)

OpenVPM is a GitHub Action that builds a repository for the VRChat Creator Companion (VCC), with a website for adding the repository, browsing packages, and downloading versions.

## Usage

Create `openvpm.yaml` in your repository:

```yaml
name: My VPM Repository
id: com.example.vpm
author: Your Name
description: Packages for my VRChat projects.
primaryColor: "#08BDBB"

packageSources:
  - name: your-name/your-package
    assetPattern: "com.example.your-package-*.zip"

upmRegistries:
  - name: OpenUPM
    url: https://package.openupm.com
```

- `packageSources` selects ZIP assets from GitHub Releases. Each ZIP must contain a valid VPM `package.json` at its root. Draft releases and prereleases are excluded.
- `upmRegistries` optionally resolves UPM dependencies unavailable from Unity's default registry. Registries are tried in order, and dependencies are resolved recursively and converted to VPM packages.
- `description` and `primaryColor` are optional. The default color is `#08BDBB`; `assetPattern` defaults to `*.zip`.

Add a workflow at `.github/workflows/build.yml`:

```yaml
name: Build VPM repository

on:
  workflow_dispatch:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: openvpm/openvpm@main
        with:
          base-url: https://your-name.github.io/your-repository/
```

The example uses the development branch; use a release tag or commit SHA to pin a version.

Publish the generated `dist/` directory to GitHub Pages or another static hosting service. Deployment is a separate step. Set `base-url` to its public URL; VCC uses `<base-url>/index.json`.

| Input      | Default        | Description                          |
| ---------- | -------------- | ------------------------------------ |
| `base-url` | Required       | Public base URL.                     |
| `config`   | `openvpm.yaml` | Configuration path in the workspace. |
| `output`   | `dist`         | Output directory in the workspace.   |

## Redistribution

**Publishing the generated repository redistributes the packages collected from GitHub Releases. Packages resolved through `upmRegistries`, including transitive dependencies, are also repackaged and redistributed as VPM packages.**

Check that each package's license permits redistribution and conversion, and comply with its conditions, including any required notices. OpenVPM does not verify redistribution permissions. Packages retain their own licenses; OpenVPM's MIT License does not apply to them.

## Local development

Use Node.js 24 and the pnpm version in `package.json`. Create `.env.local`:

```dotenv
GITHUB_TOKEN=your-github-token
OPENVPM_BASE_URL=http://localhost:5173/dist/
GITHUB_REPOSITORY=your-name/your-repository
```

`GITHUB_REPOSITORY` is optional and sets the website's GitHub link.

```sh
pnpm install --frozen-lockfile
pnpm build:local
pnpm dev
```

The development UI reads `dist/index.json`. Rebuild after changing package sources.

## License

[MIT](LICENSE) © 2026 OpenVPM
