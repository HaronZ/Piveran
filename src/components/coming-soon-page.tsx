import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function ComingSoonPage({
  title,
  description,
  icon,
}: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 mb-6">
          {icon || <Construction className="h-10 w-10 text-amber-500" />}
        </div>
        <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This module is currently under development and will be available in an
          upcoming release. Stay tuned!
        </p>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground/60">
          <Construction className="h-3.5 w-3.5" />
          <span>Under Development</span>
        </div>
      </div>
    </div>
  );
}
