import { cn } from "@/lib/utils.ts";
import { ExternalLinkIcon } from "lucide-react";
import { buttonVariants } from "./ui/button.tsx";

const owner = import.meta.env.VITE_GITHUB_OWNER;
const repo = import.meta.env.VITE_GITHUB_REPO;
const repositoryUrl = import.meta.env.VITE_GITHUB_REPOSITORY_URL;

export default function GitHubLink() {
  if (!owner || !repo) return null;

  return (
    <a
      href={
        repositoryUrl ||
        `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
      }
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${owner}/${repo} on GitHub (opens in a new tab)`}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "group max-w-full min-w-0",
      )}
    >
      <span className="relative size-4 shrink-0" aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}github.svg`}
          alt=""
          className="absolute inset-0 size-4 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"
        />
        <ExternalLinkIcon className="absolute inset-0 size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </span>
      <span className="truncate">
        {owner}/{repo}
      </span>
    </a>
  );
}
