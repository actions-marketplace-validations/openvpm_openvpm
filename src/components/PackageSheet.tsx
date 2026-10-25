import PackageDetailsSheetContent from "@/components/PackageDetailsSheetContent.tsx";
import PackageListSheetContent from "@/components/PackageListSheetContent.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Sheet, SheetTrigger } from "@/components/ui/sheet.tsx";
import { PackageIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import type { VpmRepository } from "../../schemas.ts";

export default function PackageSheet({
  repository,
  onOpenChangeComplete,
  ...props
}: {
  repository: VpmRepository;
} & ComponentProps<typeof Sheet>) {
  const [query, setQuery] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );

  const selectedPackage = selectedPackageId
    ? repository.packages[selectedPackageId]
    : undefined;

  return (
    <Sheet
      {...props}
      onOpenChangeComplete={(open) => {
        if (!open) setSelectedPackageId(null);
        onOpenChangeComplete?.(open);
      }}
    >
      <SheetTrigger render={<Button variant="outline" />}>
        <PackageIcon aria-hidden="true" />
        View packages
      </SheetTrigger>
      {selectedPackage ? (
        <PackageDetailsSheetContent
          key={selectedPackageId}
          versions={selectedPackage.versions}
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
          onBack={() => setSelectedPackageId(null)}
        />
      ) : (
        <PackageListSheetContent
          repository={repository}
          query={query}
          onQueryChange={setQuery}
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
          onSelectPackage={setSelectedPackageId}
        />
      )}
    </Sheet>
  );
}
