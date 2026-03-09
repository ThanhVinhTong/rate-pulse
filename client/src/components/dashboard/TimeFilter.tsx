"use client";

import { useTimeFilter } from "@/hooks/useTimeFilter";
import { TIME_RANGES } from "@/lib/constants";
import type { TimeRange } from "@/types";

import { Tabs } from "@/components/ui/Tabs";

interface TimeFilterProps {
  value: TimeRange;
}

export function TimeFilter({ value }: TimeFilterProps) {
  const { setRange } = useTimeFilter();

  return (
    <Tabs
      value={value}
      onChange={setRange}
      items={TIME_RANGES.map((range) => ({ id: range, label: range }))}
    />
  );
}
