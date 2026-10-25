import { ExternalLinkIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 underline underline-offset-4"
    >
      <ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
