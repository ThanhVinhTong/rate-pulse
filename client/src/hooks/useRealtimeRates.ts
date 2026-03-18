"use client";

import { useEffect, useState } from "react";

import type { CurrencyPair } from "@/types";

export function useRealtimeRates(initialPairs: CurrencyPair[]) {
  const [pairs, setPairs] = useState(initialPairs);

  useEffect(() => {
    setPairs(initialPairs);
  }, [initialPairs]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPairs((current) =>
        current.map((pair) => {
          const shift = (Math.random() - 0.5) * 0.004;
          const nextRate = Number((pair.rate * (1 + shift / 100)).toFixed(4));
          const nextSparkline = [...pair.sparkline.slice(1), nextRate];

          return {
            ...pair,
            rate: nextRate,
            change: Number((pair.change + shift).toFixed(2)),
            sparkline: nextSparkline,
          };
        }),
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return pairs;
}
