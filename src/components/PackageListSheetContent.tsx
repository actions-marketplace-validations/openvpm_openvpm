import Avatar from "@/components/Avatar.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group.tsx";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item.tsx";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { cn } from "@/lib/utils.ts";
import { SearchIcon } from "lucide-react";
import { type ComponentProps, useId, useMemo } from "react";
import { maxSatisfying, rsort } from "semver";
import type { VpmRepository } from "../../schemas.ts";

function PackageListItem({
  versions,
  className,
  ...props
}: { versions: VpmRepository["packages"][string]["versions"] } & ComponentProps<
  typeof Item
>) {
  const id = useId();
  const latestVersion =
    versions[
      maxSatisfying(Object.keys(versions), "*") ??
        rsort(Object.keys(versions))[0]
    ];

  return (
    <Item
      aria-labelledby={`${id}-title`}
      aria-describedby={
        latestVersion.description ? `${id}-description` : undefined
      }
      className={cn(
        "hover:bg-muted flex-nowrap transition-colors duration-200",
        className,
      )}
      {...props}
    >
      <ItemMedia variant="icon">
        <Avatar name={latestVersion.displayName} decorative />
      </ItemMedia>
      <ItemContent className="min-w-0 select-none">
        <ItemTitle id={`${id}-title`}>{latestVersion.displayName}</ItemTitle>
        {latestVersion.description && (
          <ItemDescription
            id={`${id}-description`}
            className="line-clamp-2 wrap-break-word"
          >
            {latestVersion.description}
          </ItemDescription>
        )}
      </ItemContent>
    </Item>
  );
}

export default function PackageListSheetContent({
  repository,
  query,
  onQueryChange,
  onSelectPackage,
  ...props
}: {
  repository: VpmRepository;
  query: string;
  onQueryChange: (query: string) => void;
  onSelectPackage: (id: string) => void;
} & ComponentProps<typeof SheetContent>) {
  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return Object.entries(repository.packages)
      .map(([id, { versions }]) => ({
        id,
        versions,
      }))
      .filter(({ id, versions }) => {
        const manifests = Object.values(versions);

        if (!manifests.length) {
          return false;
        }

        return (
          id.toLowerCase().includes(normalizedQuery) ||
          manifests.some((manifest) =>
            [manifest.name, manifest.displayName].some((value) =>
              value.toLowerCase().includes(normalizedQuery),
            ),
          )
        );
      });
  }, [repository.packages, query]);

  return (
    <SheetContent {...props}>
      <SheetHeader className="shrink-0 pr-12">
        <SheetTitle>Packages</SheetTitle>
        <SheetDescription className="sr-only">
          Search packages and view their details.
        </SheetDescription>
      </SheetHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <InputGroup className="shrink-0">
          <InputGroupInput
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${repository.name}...`}
            aria-label="Search packages"
            type="search"
          />
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>

        <ul
          aria-label="Packages"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto"
        >
          {filteredPackages.map(({ id, versions }) => (
            <li key={id}>
              <PackageListItem
                versions={versions}
                render={<button type="button" />}
                className="cursor-pointer text-left"
                onClick={() => onSelectPackage(id)}
              />
            </li>
          ))}
          {filteredPackages.length === 0 && (
            <li className="text-muted-foreground py-8 text-center text-sm">
              <p role="status">No packages found.</p>
            </li>
          )}
        </ul>
      </div>
    </SheetContent>
  );
}
