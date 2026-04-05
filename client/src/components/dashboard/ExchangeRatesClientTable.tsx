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

/**
 * `variant="hero"` — text on tinted emerald panels (`bg-emerald-50/90`, `dark:bg-emerald-950/50`).
 * `variant="default"` — on neutral page backgrounds.
 */
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
    ? "font-mono text-sm font-semibold text-emerald-900 dark:text-emerald-200"
    : "font-mono font-semibold text-emerald-700 dark:text-emerald-300";

  const nameClass = hero
    ? "min-w-0 text-base font-medium leading-snug text-neutral-900 dark:text-neutral-100"
    : "min-w-0 text-neutral-700 dark:text-neutral-300";

  const linkClass = hero
    ? "inline-flex items-center gap-1 font-medium text-emerald-700 no-underline underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:focus-visible:outline-emerald-400/40"
    : "inline-flex items-center gap-1 font-medium text-emerald-600 no-underline underline-offset-2 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300";

  const iconClass = hero
    ? "size-3 shrink-0 text-emerald-700 dark:text-emerald-400"
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
  const [targetFilter, setTargetFilter] = useState("");
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
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }

  const controlFocus =
    "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 " +
    "dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25";

  const baseCurrencySelectClass =
    "mt-1 w-full min-w-[10rem] rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm " +
    controlFocus +
    " disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900";

  const filterSelectClass = (active: boolean) =>
    [
      "mt-1 w-full min-w-[10rem] rounded-lg border bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-900",
      controlFocus,
      active
        ? "border-emerald-500 ring-2 ring-emerald-500/25 dark:border-emerald-500"
        : "border-neutral-200 dark:border-neutral-700",
    ].join(" ");

  const searchInputClass = (active: boolean) =>
    [
      "mt-1 w-full min-w-[10rem] rounded-lg border bg-neutral-50 py-2 pl-9 pr-3 text-sm dark:bg-neutral-900",
      controlFocus,
      active
        ? "border-emerald-500 ring-2 ring-emerald-500/25 dark:border-emerald-500"
        : "border-neutral-200 dark:border-neutral-700",
    ].join(" ");

  const filterLabelClass = "block";

  return (
    <div className="space-y-8">
      <section
        className="rounded-xl border border-emerald-700 bg-emerald-50/90 p-4 dark:border-emerald-700 dark:bg-emerald-950/50"
        aria-label="Filters"
      >
        <h2 className="mb-4 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Filters
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <label
            className={`${filterLabelClass} shrink-0 md:min-w-[11rem]`}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Base currency
            </span>
            <select
              className={baseCurrencySelectClass}
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
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Search
            </span>
            <span className="relative mt-1 block">
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${
                  searchQuery.trim()
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-emerald-600/40 dark:text-emerald-400/40"
                }`}
                aria-hidden
              />
              <input
                type="search"
                className={searchInputClass(!!searchQuery)}
                placeholder="Search pair, type, source…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </span>
          </label>

          <label className={`${filterLabelClass} shrink-0 md:min-w-[11rem]`}>
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Source
            </span>
            <select
              className={filterSelectClass(!!sourceFilter)}
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
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Target currency
            </span>
            <select
              className={filterSelectClass(!!targetFilter)}
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
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
            Loading rates…
          </p>
        ) : null}
        {fetchError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {fetchError}
          </p>
        ) : null}
      </section>
        
      <p className="text-sm text-emerald-600 dark:text-emerald-400">
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
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/80"
            >
              <div className="p-4 pb-3">
                <div className="rounded-xl border border-emerald-700 bg-emerald-50/90 p-4 dark:border-emerald-700 dark:bg-emerald-950/50">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800/85 dark:text-emerald-400/90">
                    Source
                  </p>
                  <SourceDetailsBlock
                    code={groupKey}
                    details={meta}
                    variant="hero"
                  />
                </div>
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {rows.map((r) => (
                  <li key={r.RateID} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Pair
                        </p>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {r.SourceCurrencyCode} →{" "}
                          {r.DestinationCurrencyCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Rate
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {roundUp(Number(r.RateValue), 3)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Type
                        </span>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {nullString(r.TypeName)}
                        </p>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Valid from
                        </span>
                        <p className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                          {formatDateTime(r.ValidFromDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Updated
                        </span>
                        <p className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
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
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/50">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-emerald-800/20 bg-neutral-100/95 dark:border-emerald-900/35 dark:bg-neutral-900">
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
                    className={`border-l border-neutral-200 px-3 py-3 first:border-l-0 first:pl-4 dark:border-neutral-800 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="inline-block rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-900 dark:bg-emerald-400/90 dark:text-emerald-950">
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
                        ? "border-t-2 border-neutral-200 dark:border-neutral-800"
                        : undefined
                    }
                  >
                    <td
                      colSpan={5}
                      className={`border-0 bg-transparent px-3 pb-0 pt-1 ${groupIndex === 0 ? "pt-3" : "pt-5"}`}
                    >
                      <div className="rounded-xl border border-emerald-700 bg-emerald-50/90 p-4 dark:border-emerald-700 dark:bg-emerald-950/50">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800/85 dark:text-emerald-400/90">
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
                      className="border-b border-neutral-200 transition-colors last:border-b-0 hover:bg-neutral-100/85 dark:border-neutral-800/90 dark:hover:bg-neutral-900/70"
                    >
                      <td className="border-l-0 px-3 py-2.5 pl-4 align-middle font-medium text-neutral-900 dark:text-neutral-100">
                        <span className="tabular-nums">
                          {r.SourceCurrencyCode} ↔{" "}
                          {r.DestinationCurrencyCode}
                        </span>
                      </td>
                      <td className="border-l border-neutral-200 px-3 py-2.5 text-right align-middle tabular-nums dark:border-neutral-800">
                        <span className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {roundUp(Number(r.RateValue), 3)}
                        </span>
                      </td>
                      <td className="border-l border-neutral-200 px-3 py-2.5 align-middle text-neutral-800 dark:border-neutral-800 dark:text-neutral-200">
                        <span className="line-clamp-2 leading-snug">
                          {nullString(r.TypeName)}
                        </span>
                      </td>
                      <td className="border-l border-neutral-200 px-3 py-2.5 align-middle tabular-nums text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                        {formatDateTime(r.ValidFromDate)}
                      </td>
                      <td className="border-l border-neutral-200 px-3 py-2.5 pr-4 align-middle tabular-nums text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
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
