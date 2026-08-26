import { cn, initials } from "@/lib/utils";

const PALETTE = [
  ["bg-[#e6e2d8]", "text-[#5c5a50]"], ["bg-[#dee6e0]", "text-[#3f5548]"],
  ["bg-[#e3e1ea]", "text-[#4e4c64]"], ["bg-[#eae0da]", "text-[#6b5346]"],
  ["bg-[#dfe5ec]", "text-[#40506a]"], ["bg-[#e8e4dd]", "text-[#5f5644]"],
  ["bg-[#e0e8e4]", "text-[#3a5049]"], ["bg-[#ece2e6]", "text-[#684b55]"],
  ["bg-[#e2e6de]", "text-[#4a5640]"], ["bg-[#e5e1e9]", "text-[#534b66]"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const SIZES = {
  xs: "size-5 text-[9px]", sm: "size-6 text-[10px]", md: "size-8 text-[11px]",
  lg: "size-10 text-[13px]", xl: "size-14 text-[17px]", "2xl": "size-20 text-[24px]",
  "3xl": "size-28 text-[34px]",
} as const;

export function Avatar({
  name, size = "md", className, ring,
}: { name: string; size?: keyof typeof SIZES; className?: string; ring?: boolean }) {
  const [bg, fg] = PALETTE[hash(name) % PALETTE.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium tracking-wide",
        bg, fg, SIZES[size], ring && "ring-2 ring-surface", className
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = "sm" }: { names: string[]; max?: number; size?: keyof typeof SIZES }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((n) => <Avatar key={n} name={n} size={size} ring />)}
      {rest > 0 && (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-sunken text-ink-3 font-medium ring-2 ring-surface", SIZES[size])}>
          +{rest}
        </span>
      )}
    </div>
  );
}
