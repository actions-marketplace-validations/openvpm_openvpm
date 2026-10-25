import { cn } from "@/lib/utils.ts";
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
        "max-w-full min-w-0",
      )}
    >
      <img
        src={`${import.meta.env.BASE_URL}github.svg`}
        alt=""
        className="size-4 shrink-0"
      />
      <span className="truncate">
        {owner}/{repo}
      </span>
    </a>
  );
}
