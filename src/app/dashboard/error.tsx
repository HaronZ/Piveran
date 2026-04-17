"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md w-full border-red-500/20 bg-card/60 backdrop-blur-md">
        <CardContent className="flex flex-col items-center text-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load this page. Try again, or head back to the dashboard.
            </p>
            {error.digest && (
              <p className="pt-1 font-mono text-[10px] text-muted-foreground/60">
                ref: {error.digest}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={reset} variant="default" className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-1.5">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
