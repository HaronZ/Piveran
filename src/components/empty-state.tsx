import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-4 gap-3",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground/60",
            iconClassName
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
