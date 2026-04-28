"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { 
  ExchangeRateLatest, 
  Currency,
  RateSourceMetadata,
  EXCHANGE_RATES_LIMIT 
} from "@/types/exchange-rates";

function nullString(
  v: { String: string; Valid: boolean } | null | undefined,
): string {
  return v?.Valid ? v.String : "—";
}

/** Same output on Node (SSR) and browser — avoids hydration mismatch. */
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function nullTime(
  v: { Time: string; Valid: boolean } | null | undefined,
): string {
  return v?.Valid ? formatDateTime(v.Time) : "—";
}

/** API may return a non-array when there are no rows — keep UI stable. */
function asRateArray(v: unknown): ExchangeRateLatest[] {
  return Array.isArray(v) ? v : [];
}

function roundUp(num: number, precision: number) {
  if (isNaN(num)) {
    return "0.0000";
  }
  if (isNaN(precision)) {
    precision = 4;
  }
  return num.toFixed(precision);
}

function rateSourceKey(r: ExchangeRateLatest): string {
  return r.RateSourceCode?.Valid ? r.RateSourceCode.String : "UNKNOWN";
}

function currencyLabel(c: Currency): string {
  return `${c.CurrencyCode} — ${c.CurrencyName}`;
}

type Props = {
  apiBase: string;
  initialSourceCurrencyId: number;
  initialRates: ExchangeRateLatest[];
  initialTargetCurrencyCode: string;
  currencies: Currency[];
  rateSources: RateSourceMetadata[];
};

type GoNullString = { String: string; Valid: boolean };

function wireString(v: string | GoNullString | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object" && v.Valid && typeof v.String === "string") {
    return v.String.trim();
  }
  return "";
}

type GoNullInt32 = { Int32: number; Valid: boolean };

function wireInt32(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") {
    const o = v as Partial<GoNullInt32>;
    if (typeof o.Int32 === "number" && o.Valid === true) return o.Int32;
  }
  return null;
}

type SourceDetails = { name: string; link: string };

function safeExternalHref(url: string): string {
  const t = url.trim();
  if (!t) return "#";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

function buildSourceMetaMap(
  rateSources: RateSourceMetadata[],
): Map<string, SourceDetails> {
  const m = new Map<string, SourceDetails>();
  for (const rs of rateSources) {
    const code = wireString(rs.SourceCode);
    if (!code) continue;
    m.set(code, {
      name: rs.SourceName?.trim() ?? "",
      link: wireString(rs.SourceLink),
    });
  }
  return m;
}

function SourceDetailsBlock({
  code,
  details,
  compact,
  variant = "hero",
}: {
  code: string;
  details: SourceDetails | undefined;
  compact?: boolean;
  variant?: "hero" | "default";
}) {
  const link = details?.link;
  const name = details?.name;
  const isUnknown = code === "UNKNOWN";
  const hero = variant === "hero";

  const codeClass = hero
    ? "font-mono text-sm font-semibold text-text-primary"
    : "font-mono font-semibold text-primary";

  const nameClass = hero
    ? "min-w-0 text-base font-medium leading-snug text-text-primary"
    : "min-w-0 text-text-muted";

  const linkClass = hero
    ? "inline-flex items-center gap-1 font-medium text-primary no-underline underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
    : "inline-flex items-center gap-1 font-medium text-primary no-underline underline-offset-2 hover:underline";

  const iconClass = hero
    ? "size-3 shrink-0 text-primary"
    : "size-3 shrink-0 opacity-80";

  return (
    <div
      className={
        compact
          ? "flex min-w-0 flex-col gap-0.5 text-xs"
          : "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
      }
    >
      <span className={codeClass}>{isUnknown ? "—" : code}</span>
      {name ? <span className={nameClass}>{name}</span> : null}
      {link ? (
        <a
          href={safeExternalHref(link)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <span className="max-w-[12rem] truncate sm:max-w-xs">
            {compact
              ? "Link"
              : link.replace(/^https?:\/\//, "").split("/")[0] || "Link"}
          </span>
          <ExternalLink className={iconClass} aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

export function ExchangeRatesClientTable({
  apiBase,
  initialSourceCurrencyId,
  initialTargetCurrencyCode,
  initialRates,
  currencies,
  rateSources,
}: Props) {
  const [rates, setRates] = useState<ExchangeRateLatest[]>(() =>
    asRateArray(initialRates),
  );
  const [sourceCurrencyId, setSourceCurrencyId] = useState(
    initialSourceCurrencyId,
  );
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState(
    initialTargetCurrencyCode
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const sourceMetaByCode = useMemo(
    () => buildSourceMetaMap(rateSources),
    [rateSources],
  );

  const sortedCurrencies = useMemo(
    () =>
      [...currencies].sort((a, b) =>
        a.CurrencyCode.localeCompare(b.CurrencyCode),
      ),
    [currencies],
  );

  const sourceOptions = useMemo(() => {
    const fromApi = rateSources
      .filter((rs) => wireInt32((rs as any).CurrencyID) === sourceCurrencyId)
      .map((rs) => {
        const code = wireString(rs.SourceCode);
        if (!code) return null;
        return { code, label: `${code} — ${rs.SourceName}` };
      })
      .filter(Boolean) as { code: string; label: string }[];

    const seen = new Set(fromApi.map((o) => o.code));
    for (const r of rates) {
      const k = rateSourceKey(r);
      if (k !== "UNKNOWN" && !seen.has(k)) {
        seen.add(k);
        fromApi.push({ code: k, label: k });
      }
    }
    return fromApi.sort((a, b) => a.code.localeCompare(b.code));
  }, [rateSources, rates]);

  const targetOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rates) {
      set.add(r.DestinationCurrencyCode);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rates]);

  const filteredRates = useMemo(() => {
    let out = rates;
    if (sourceFilter) {
      out = out.filter((r) => rateSourceKey(r) === sourceFilter);
    }
    if (targetFilter) {
      out = out.filter((r) => r.DestinationCurrencyCode === targetFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const hay = [
          r.SourceCurrencyCode,
          r.DestinationCurrencyCode,
          nullString(r.TypeName),
          rateSourceKey(r),
          r.RateValue,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return out;
  }, [rates, sourceFilter, targetFilter, searchQuery]);

  const groups = useMemo(() => {
    const m = new Map<string, ExchangeRateLatest[]>();
    for (const r of filteredRates) {
      const key = rateSourceKey(r);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    return m;
  }, [filteredRates]);

  async function handleBaseCurrencyChange(id: number) {
    setSourceCurrencyId(id);
    setFetchError(null);
    setLoading(true);
    try {
      console.log("handleBaseCurrencyChange", id);
      const res = await fetch(
        `${apiBase}/exchange-rates-latest?source_currency_id=${id}&limit=${EXCHANGE_RATES_LIMIT}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const data: unknown = await res.json();
      setRates(asRateArray(data));
      setTargetFilter("");
      setSourceFilter("");
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }

  const controlClass =
    "mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm " +
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
  
  const searchInputClass =
    "mt-1 h-10 w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-text-primary shadow-sm " +
    "placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  const filterLabelClass = "block";

  return (
    <div className="space-y-8">
      <section
        className="rounded-xl border border-border bg-card p-4 shadow-sm"
        aria-label="Filters"
      >
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Filters
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <label
            className={`${filterLabelClass} shrink-0 md:min-w-[11rem]`}
          >
            <span className="text-xs font-medium text-text-muted">
              Base currency
            </span>
            <select
              className={controlClass}
              value={sourceCurrencyId}
              disabled={loading}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (Number.isFinite(id) && id > 0) {
                  void handleBaseCurrencyChange(id);
                }
              }}
            >
              {sortedCurrencies.map((c) => (
                <option key={c.CurrencyID} value={c.CurrencyID}>
                  {currencyLabel(c)}
                </option>
              ))}
            </select>
          </label>

          <label
            className={`${filterLabelClass} min-w-0 flex-1 md:min-w-[12rem] md:max-w-xs`}
          >
            <span className="text-xs font-medium text-text-muted">
              Search
            </span>
            <span className="relative mt-1 block">
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary`}
                aria-hidden
              />
              <input
                type="search"
                className={searchInputClass}
                placeholder="Search pair, type, source…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </span>
          </label>

          <label className={`${filterLabelClass} shrink-0 md:min-w-[11rem]`}>
            <span className="text-xs font-medium text-text-muted">
              Source
            </span>
            <select
              className={controlClass}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="">All sources</option>
              {sourceOptions.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className={`${filterLabelClass} shrink-0 md:min-w-[11rem]`}>
            <span className="text-xs font-medium text-text-muted">
              Target currency
            </span>
            <select
              className={controlClass}
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
            >
              <option value="">All targets</option>
              {targetOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-text-muted">
            Loading rates…
          </p>
        ) : null}
        {fetchError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {fetchError}
          </p>
        ) : null}
      </section>
        
      <p className="text-sm text-text-muted">
        Showing {filteredRates.length} of {rates.length} rates
        {loading ? "" : "."}
      </p>

      {/* Mobile: box / card layout */}
      <div className="space-y-5 md:hidden">
        {[...groups.entries()].map(([groupKey, rows]) => {
          const meta = sourceMetaByCode.get(groupKey);
          return (
            <section
              key={groupKey}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="p-4 pb-3">
                <div className="rounded-lg border border-border bg-panel p-3">
                  <p className="mb-1 text-[11px] font-medium text-text-muted">
                    Source
                  </p>
                  <SourceDetailsBlock
                    code={groupKey}
                    details={meta}
                    variant="hero"
                  />
                </div>
              </div>
              <ul className="divide-y divide-border">
                {rows.map((r) => (
                  <li key={r.RateID} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-text-muted">
                          Pair
                        </p>
                        <p className="font-medium text-text-primary">
                          {r.SourceCurrencyCode} →{" "}
                          {r.DestinationCurrencyCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-text-muted">
                          Rate
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-primary">
                          {roundUp(Number(r.RateValue), 3)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-text-muted">
                          Type
                        </span>
                        <p className="font-medium text-text-primary">
                          {nullString(r.TypeName)}
                        </p>
                      </div>
                      <div>
                        <span className="text-text-muted">
                          Valid from
                        </span>
                        <p className="font-medium tabular-nums text-text-primary">
                          {formatDateTime(r.ValidFromDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-text-muted">
                          Updated
                        </span>
                        <p className="font-medium tabular-nums text-text-primary">
                          {nullTime(r.UpdatedAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Desktop: table — source only in group hero; fixed columns for alignment */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-panel">
                {(
                  [
                    { label: "Pair", align: "left" },
                    { label: "Rate", align: "right" },
                    { label: "Type", align: "left" },
                    { label: "Valid from", align: "left" },
                    { label: "Updated", align: "left" },
                  ] as const
                ).map((col) => (
                  <th
                    key={col.label}
                    scope="col"
                    className={`border-l border-border px-3 py-3 first:border-l-0 first:pl-4 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="text-xs font-medium text-text-muted">
                      {col.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            {[...groups.entries()].map(([groupKey, rows], groupIndex) => {
              const meta = sourceMetaByCode.get(groupKey);
              return (
                <tbody key={groupKey}>
                  <tr
                    className={
                      groupIndex > 0
                        ? "border-t border-border"
                        : undefined
                    }
                  >
                    <td
                      colSpan={5}
                      className={`border-0 bg-transparent px-3 pb-0 pt-1 ${groupIndex === 0 ? "pt-3" : "pt-5"}`}
                    >
                      <div className="rounded-lg border border-border bg-panel p-3">
                        <p className="mb-1 text-[11px] font-medium text-text-muted">
                          Source
                        </p>
                        <SourceDetailsBlock
                          code={groupKey}
                          details={meta}
                          variant="hero"
                        />
                      </div>
                    </td>
                  </tr>
                  {rows.map((r) => (
                    <tr
                      key={r.RateID}
                      className="border-b border-border hover:bg-panel/70 transition-colors last:border-b-0"
                    >
                      <td className="border-l-0 px-3 py-2.5 pl-4 align-middle font-medium text-text-primary">
                        <span className="tabular-nums">
                          {r.SourceCurrencyCode} ↔{" "}
                          {r.DestinationCurrencyCode}
                        </span>
                      </td>
                      <td className="border-l border-border px-3 py-2.5 text-right align-middle tabular-nums">
                        <span className="text-md font-medium tabular-nums text-primary">
                          {roundUp(Number(r.RateValue), 3)}
                        </span>
                      </td>
                      <td className="border-l border-border px-3 py-2.5 align-middle text-text-primary">
                        <span className="line-clamp-2 leading-snug">
                          {nullString(r.TypeName)}
                        </span>
                      </td>
                      <td className="border-l border-border px-3 py-2.5 align-middle tabular-nums text-text-muted">
                        {formatDateTime(r.ValidFromDate)}
                      </td>
                      <td className="border-l border-border px-3 py-2.5 pr-4 align-middle tabular-nums text-text-muted">
                        {nullTime(r.UpdatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      </div>
    </div>
  );
}
