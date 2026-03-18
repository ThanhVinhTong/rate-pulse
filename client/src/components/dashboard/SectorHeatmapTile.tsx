"use client";

import { memo, type CSSProperties } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { formatPercent } from "@/lib/utils";
import type { SectorData } from "@/types";

interface SectorHeatmapTileProps {
  item: SectorData;
}

const POSITIVE_COLOR = "#00af30";
const NEGATIVE_COLOR = "#f30000";
const NEUTRAL_COLOR = "#5c5769";

function getTileColor(performance: number) {
  if (performance > 0.15) {
    return POSITIVE_COLOR;
  }

  if (performance < -0.15) {
    return NEGATIVE_COLOR;
  }

  return NEUTRAL_COLOR;
}

function hexToRgba(hex: string, opacity: number) {
  const normalizedHex = hex.replace("#", "");
  const parsedValue = Number.parseInt(normalizedHex, 16);
  const red = (parsedValue >> 16) & 255;
  const green = (parsedValue >> 8) & 255;
  const blue = parsedValue & 255;

  return `rgba(${red}, ${green}, ${blue}, ${opacity.toFixed(2)})`;
}

function getTileStyle(performance: number): CSSProperties {
  const baseColor = getTileColor(performance);
  const opacity = 0.4 + (Math.min(Math.abs(performance) / 5 * 100, 100) / 100) * 0.6;

  return {
    backgroundColor: hexToRgba(baseColor, opacity),
    borderColor: baseColor,
  };
}

function PerformanceIcon({ performance }: Pick<SectorData, "performance">) {
  if (performance > 0.15) {
    return <TrendingUp className="h-5 w-5" aria-hidden="true" />;
  }

  if (performance < -0.15) {
    return <TrendingDown className="h-5 w-5" aria-hidden="true" />;
  }

  return <Minus className="h-5 w-5" aria-hidden="true" />;
}

export const SectorHeatmapTile = memo(function SectorHeatmapTile({
  item,
}: SectorHeatmapTileProps) {
  return (
    <article
      className="rounded-xl border-2 p-6 text-white transition-all hover:scale-[1.03]"
      style={getTileStyle(item.performance)}
      aria-label={`${item.sector} sector, ${formatPercent(item.performance)} performance, volume ${item.volume}, market cap ${item.marketCap}`}
    >
      <p className="text-sm font-semibold">{item.sector}</p>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-2xl font-bold">{formatPercent(item.performance)}</span>
        <PerformanceIcon performance={item.performance} />
      </div>

      <div className="mt-5 space-y-2 text-xs opacity-90">
        <div className="flex items-center justify-between gap-3">
          <span>Volume</span>
          <span>{item.volume}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Market Cap</span>
          <span>{item.marketCap}</span>
        </div>
      </div>
    </article>
  );
});
