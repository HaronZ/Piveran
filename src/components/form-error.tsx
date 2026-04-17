import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message?: string | null;
  className?: string;
}

export function FormError({ message, className }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
