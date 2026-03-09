"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TimeRange } from "@/types";

export function useTimeFilter() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const setRange = (range: TimeRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return { setRange };
}
