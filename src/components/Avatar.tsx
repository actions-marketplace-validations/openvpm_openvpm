import { cn } from "@/lib/utils.ts";

function getInitials(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return "?";
  }

  const parts = trimmed.split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

function getHue(name: string) {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return hash;
}

export default function Avatar({
  name,
  className,
  shape,
  decorative = false,
}: {
  name: string;
  className?: string;
  shape?: "circle" | "square";
  decorative?: boolean;
}) {
  const initials = getInitials(name);
  const hue = getHue(name);

  return (
    <div
      className={cn(
        "@container flex size-9 shrink-0 items-center justify-center font-medium text-white transition-colors duration-300 select-none",
        shape === "circle" ? "rounded-full" : "rounded-md",
        className,
      )}
      style={{
        backgroundColor: `oklch(0.62 0.16 ${hue})`,
      }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      <span className="text-[42cqi] leading-none">{initials}</span>
    </div>
  );
}
