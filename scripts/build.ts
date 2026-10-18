import { resolve } from "node:path";

const WORKSPACE = requireEnv("OPENVPM_WORKSPACE");

const CONFIG_PATH = resolve(WORKSPACE, requireEnv("OPENVPM_CONFIG"));

const OUTPUT_PATH = resolve(WORKSPACE, requireEnv("OPENVPM_OUTPUT"));

const BASE_URL = requireEnv("OPENVPM_BASE_URL");

const GITHUB_TOKEN = requireEnv("GITHUB_TOKEN");

async function main() {
  // TODO: Build the VPM repository
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
