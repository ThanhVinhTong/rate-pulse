"use client";

import { Fragment, useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface ExchangeRateLatest {
  RateID: number;
  RateValue: string;
  SourceCurrencyCode: string;
  DestinationCurrencyCode: string;
  ValidFromDate: string;
  RateSourceCode: {
    String: string;
    Valid: boolean;
  } | null;
  TypeName: {
    String: string;
    Valid: boolean;
  } | null;
  CreatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
}

export interface CurrencyOption {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  CurrencySymbol?: {
    String: string;
    Valid: boolean;
  } | null;
}

interface RateSourceApi {
  SourceID: number;
  SourceName: string;
  SourceCode?: {
    String: string;
    Valid: boolean;
  } | null;
}

/** Stable across Node SSR and browser (avoids hydration mismatch). */
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

function nullString(
  v: { String: string; Valid: boolean } | null | undefined,
): string {
  return v?.Valid ? v.String : "—";
}

function nullTime(
  v: { Time: string; Valid: boolean } | null | undefined,
): string {
  return v?.Valid ? formatDateTime(v.Time) : "—";
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

function sourceCodeFromApi(rs: RateSourceApi): string | null {
  return rs.SourceCode?.Valid ? rs.SourceCode.String : null;
}

function currencyLabel(c: CurrencyOption): string {
  const sym = nullString(c.CurrencySymbol);
  const code = c.CurrencyCode;
  if (sym && sym !== "—") return `${sym} ${code}`;
  return code;
}

const LIMIT = 200;

type Props = {
  apiBase: string;
  initialSourceCurrencyId: number;
  initialRates: ExchangeRateLatest[];
  currencies: CurrencyOption[];
  rateSources: RateSourceApi[];
};

export function ExchangeRatesClientTable({
  apiBase,
  initialSourceCurrencyId,
  initialRates,
  currencies,
  rateSources,
}: Props) {
  const [rates, setRates] = useState<ExchangeRateLatest[]>(initialRates);
  const [sourceCurrencyId, setSourceCurrencyId] = useState(
    initialSourceCurrencyId,
  );
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
        const code = sourceCodeFromApi(rs);
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
        `${apiBase}/exchange-rates-latest?source_currency_id=${id}&limit=${LIMIT}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const next: ExchangeRateLatest[] = await res.json();
      setRates(next);
      setTargetFilter("");
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }

  const baseSelectClass =
    "mt-1 w-full min-w-[10rem] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";
  const inputClass =
    "mt-1 w-full min-w-[10rem] rounded-lg border border-neutral-200 bg-white px-3 py-2 pl-9 text-sm dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <div className="space-y-6">
      <section
        className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-label="Filters"
      >
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Filters
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <label className="block shrink-0 md:min-w-[11rem]">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Base currency
            </span>
            <select
              className={baseSelectClass}
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

          <label className="block min-w-0 flex-1 md:min-w-[12rem] md:max-w-xs">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Search
            </span>
            <span className="relative mt-1 block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <input
                type="search"
                className={inputClass}
                placeholder="Search pair, type, source…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </span>
          </label>

          <label className="block shrink-0 md:min-w-[11rem]">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Source
            </span>
            <select
              className={baseSelectClass}
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

          <label className="block shrink-0 md:min-w-[11rem]">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Target currency
            </span>
            <select
              className={baseSelectClass}
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
          <p className="mt-3 text-sm text-neutral-500">Loading rates…</p>
        ) : null}
        {fetchError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {fetchError}
          </p>
        ) : null}
      </section>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Showing {filteredRates.length} of {rates.length} rates
        {loading ? "" : "."}
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="hidden md:table-header-group">
            <tr className="text-left text-lg font-bold uppercase tracking-wide">
              <th className="p-2">Pair</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Type</th>
              <th className="p-2">Source</th>
              <th className="p-2">Valid from</th>
              <th className="p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {[...groups.entries()].map(([groupKey, rows]) => (
              <Fragment key={groupKey}>
                <tr className="block border-b border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 md:table-row">
                  <td
                    colSpan={6}
                    className="block w-full p-2 font-semibold md:table-cell"
                  >
                    Source: {groupKey}
                  </td>
                </tr>
                {rows.map((r) => (
                  <tr
                    key={r.RateID}
                    className="block border-b border-neutral-200 dark:border-neutral-800 md:table-row md:py-3"
                  >
                    <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                      <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                        Pair:{" "}
                      </span>
                      {r.SourceCurrencyCode} → {r.DestinationCurrencyCode}
                    </td>
                    <td className="block w-full p-2 md:table-cell md:w-auto md:p-2 tabular-nums">
                      <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                        Rate:{" "}
                      </span>
                      {roundUp(Number(r.RateValue), 3)}
                    </td>
                    <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                      <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                        Type:{" "}
                      </span>
                      {nullString(r.TypeName)}
                    </td>
                    <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                      <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                        Source:{" "}
                      </span>
                      {nullString(r.RateSourceCode)}
                    </td>
                    <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                      <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                        Valid from:{" "}
                      </span>
                      {formatDateTime(r.ValidFromDate)}
                    </td>
                    <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                      <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                        Updated:{" "}
                      </span>
                      {nullTime(r.UpdatedAt)}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
