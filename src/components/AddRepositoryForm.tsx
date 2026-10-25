import { Button } from "@/components/ui/button.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group.tsx";
import { CheckIcon, CopyIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AddRepositoryForm({ url }: { url: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = setTimeout(() => setCopyStatus("idle"), 2500);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  return (
    <form
      aria-label="Add repository to VCC"
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = `vcc://vpm/addRepo?url=${encodeURIComponent(url)}`;
      }}
    >
      <div className="flex items-center gap-2">
        <InputGroup className="group bg-background h-10 min-w-0 flex-1">
          <InputGroupInput
            name="url"
            type="url"
            value={url}
            readOnly
            aria-label="Repository URL"
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-xs"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-sm"
              aria-label="Copy repository URL"
              title={copyStatus === "copied" ? "Copied" : "Copy URL"}
              className="pointer-events-none opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopyStatus("copied");
                } catch {
                  setCopyStatus("error");
                }
              }}
            >
              {copyStatus === "copied" ? (
                <CheckIcon aria-hidden="true" />
              ) : (
                <CopyIcon aria-hidden="true" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <Button type="submit" className="h-10 px-4">
          <PlusIcon aria-hidden="true" />
          Add to VCC
        </Button>
      </div>
      <p
        role="status"
        className={
          copyStatus === "error" ? "text-destructive mt-2 text-xs" : "sr-only"
        }
      >
        {copyStatus === "copied" && "Repository URL copied."}
        {copyStatus === "error" &&
          "Could not copy. Select the URL and copy it manually."}
      </p>
    </form>
  );
}
