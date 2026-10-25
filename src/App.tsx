import AddRepositoryForm from "@/components/AddRepositoryForm.tsx";
import GitHubLink from "@/components/GitHubLink.tsx";
import PackageSheet from "@/components/PackageSheet.tsx";
import { useEffect, useState } from "react";
import type { VpmRepository } from "../schemas.ts";

const indexUrl = `${import.meta.env.BASE_URL}${import.meta.env.DEV ? "dist/" : ""}index.json`;

export default function App() {
  const [repository, setRepository] = useState<VpmRepository | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(indexUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setRepository)
      .catch((error: Error) => {
        if (!controller.signal.aborted) setError(error.message);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-20 sm:px-6">
      <div className="w-full max-w-xl">
        {error ? (
          <div className="space-y-3 text-center" role="alert">
            <h1 className="text-xl font-semibold">Unable to load repository</h1>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : repository ? (
          <>
            <header className="mb-8 text-center">
              <h1 className="via-primary bg-linear-to-r from-[color-mix(in_oklch,var(--primary)_40%,#ec4899)] to-[color-mix(in_oklch,var(--primary)_40%,#0ea5e9)] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl forced-colors:bg-none forced-colors:text-[CanvasText]">
                {repository.name}
              </h1>
              {repository.description && (
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {repository.description}
                </p>
              )}
            </header>
            <AddRepositoryForm url={repository.url} />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <PackageSheet repository={repository} />
              <GitHubLink />
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center" role="status">
            Loading…
          </p>
        )}
      </div>
    </main>
  );
}
