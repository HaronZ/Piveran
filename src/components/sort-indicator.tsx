import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortDir = "asc" | "desc";

type Variant = "amber" | "teal";

const styles: Record<Variant, { idle: string; active: string }> = {
  amber: {
    idle: "h-3 w-3 text-muted-foreground/40",
    active: "h-3 w-3 text-amber-500",
  },
  teal: {
    idle: "h-3 w-3 ml-1 opacity-40",
    active: "h-3 w-3 ml-1 text-teal-500",
  },
};

export function SortIndicator({
  active,
  dir,
  variant = "amber",
}: {
  active: boolean;
  dir: SortDir;
  variant?: Variant;
}) {
  const s = styles[variant];
  if (!active) return <ArrowUpDown className={s.idle} />;
  return dir === "asc" ? <ArrowUp className={s.active} /> : <ArrowDown className={s.active} />;
}
