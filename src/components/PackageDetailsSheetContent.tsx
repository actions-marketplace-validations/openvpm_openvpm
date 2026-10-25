import Avatar from "@/components/Avatar.tsx";
import ExternalLink from "@/components/ExternalLink.tsx";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { ChevronLeftIcon, DownloadIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { maxSatisfying, prerelease, rsort } from "semver";
import type { VpmRepository } from "../../schemas.ts";

export default function PackageDetailsSheetContent({
  versions,
  onBack,
  ...props
}: {
  versions: VpmRepository["packages"][string]["versions"];
  onBack: () => void;
} & ComponentProps<typeof SheetContent>) {
  const versionNumbers = rsort(Object.keys(versions));
  const [version, setVersion] = useState(
    maxSatisfying(versionNumbers, "*") ?? versionNumbers[0],
  );
  const manifest = versions[version];

  return (
    <SheetContent {...props}>
      <SheetHeader className="shrink-0 flex-row items-center gap-1 pr-12">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to packages"
          onClick={onBack}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <SheetTitle className="min-w-0 wrap-break-word">
          {manifest.displayName}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Package information and version downloads.
        </SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-line">
          {manifest.description || "No description available."}
        </p>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Author</dt>
          <dd className="flex min-w-0 items-center gap-2">
            <Avatar
              name={manifest.author.name}
              shape="circle"
              className="size-6"
              decorative
            />
            <span className="min-w-0 wrap-break-word">
              {manifest.author.name}
            </span>
          </dd>
          {manifest.license && (
            <>
              <dt className="text-muted-foreground">License</dt>
              <dd className="wrap-break-word">
                {manifest.licensesUrl ? (
                  <ExternalLink href={manifest.licensesUrl}>
                    {manifest.license}
                  </ExternalLink>
                ) : (
                  manifest.license
                )}
              </dd>
            </>
          )}
          {manifest.unity && (
            <>
              <dt className="text-muted-foreground">Unity</dt>
              <dd>
                {manifest.unity}
                {manifest.unityRelease && `.${manifest.unityRelease}`}
              </dd>
            </>
          )}
          {prerelease(version) !== null && (
            <>
              <dt className="text-muted-foreground">Release</dt>
              <dd>Pre-release</dd>
            </>
          )}
          {manifest.documentationUrl && (
            <>
              <dt className="text-muted-foreground">Documentation</dt>
              <dd>
                <ExternalLink href={manifest.documentationUrl}>
                  View documentation
                </ExternalLink>
              </dd>
            </>
          )}
          {manifest.changelogUrl && (
            <>
              <dt className="text-muted-foreground">Changelog</dt>
              <dd>
                <ExternalLink href={manifest.changelogUrl}>
                  View changelog
                </ExternalLink>
              </dd>
            </>
          )}
        </dl>
      </div>
      <SheetFooter className="shrink-0 flex-row border-t">
        <Select
          value={version}
          onValueChange={(value) => {
            if (value) setVersion(value);
          }}
        >
          <SelectTrigger
            aria-label="Package version"
            className="min-w-0 flex-1 font-mono text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {versionNumbers.map((version) => (
              <SelectItem key={version} value={version}>
                {version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <a
          href={manifest.url}
          download
          className={buttonVariants()}
          aria-label={`Download ${manifest.displayName} ${version}`}
        >
          <DownloadIcon aria-hidden="true" />
          Download ZIP
        </a>
      </SheetFooter>
    </SheetContent>
  );
}
