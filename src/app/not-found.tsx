import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md w-full border-border/40 bg-card/60 backdrop-blur-md">
        <CardContent className="flex flex-col items-center text-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <FileQuestion className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p className="text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="default" className="gap-1.5">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
