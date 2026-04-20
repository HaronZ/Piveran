"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useActionParam(onNew: () => void) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      onNew();
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname, onNew]);
}
