import type {
  ExchangeRateType,
  PairSnapshot,
  SourceSnapshot,
} from "@/types";
import type { ApiCountry, ApiCurrency, ApiRateSource } from "@/lib/exchange-rate-mapper";

/** Normalized row shape (matches server exchange-rates fetch). */
export interface ExchangeRateRowInput {
  rate_id: number;
  rate_value: string;
  source_currency_id: number;
  destination_currency_id: number;
  source_id: number | null;
  type_id: number | null;
  valid_from_date: string | null;
}

function parseTime(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function mergeTypesFromApiAndRates(
  typesFromApi: ExchangeRateType[],
  rates: ExchangeRateRowInput[],
): ExchangeRateType[] {
  const byId = new Map<number, ExchangeRateType>();
  for (const t of typesFromApi) {
    byId.set(t.typeId, t);
  }
  for (const r of rates) {
    const tid = r.type_id ?? 0;
    if (!byId.has(tid)) {
      byId.set(tid, {
        typeId: tid,
        typeName: tid === 0 ? "General" : `Type ${tid}`,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.typeId - b.typeId);
}

function makeKey(
  base: string,
  target: string,
  sourceId: number,
  typeId: number,
): string {
  return `${base}\u0000${target}\u0000${sourceId}\u0000${typeId}`;
}

/**
 * Groups latest rates per (pair, source, type), then builds {@link PairSnapshot} per currency pair
 * with dynamic columns from {@link ExchangeRateType}.
 */
export function buildPairSnapshots(
  currencies: ApiCurrency[],
  countries: ApiCountry[],
  sources: ApiRateSource[],
  rates: ExchangeRateRowInput[],
  typesFromApi: ExchangeRateType[],
): PairSnapshot[] {
  const currencyById = new Map(currencies.map((c) => [c.CurrencyID, c]));
  const sourceById = new Map(sources.map((s) => [s.SourceID, s]));
  const countryByCurrencyId = new Map<number, string>();
  for (const country of countries) {
    if (!countryByCurrencyId.has(country.CurrencyID)) {
      countryByCurrencyId.set(country.CurrencyID, country.CountryName);
    }
  }

  const columnTypes = mergeTypesFromApiAndRates(typesFromApi, rates);

  const latest = new Map<string, ExchangeRateRowInput>();
  for (const rate of rates) {
    const sourceCurrency = currencyById.get(rate.source_currency_id);
    const destinationCurrency = currencyById.get(rate.destination_currency_id);
    if (!sourceCurrency || !destinationCurrency) {
      continue;
    }

    const base = sourceCurrency.CurrencyCode;
    const target = destinationCurrency.CurrencyCode;
    const sid = rate.source_id ?? 0;
    const tid = rate.type_id ?? 0;
    const key = makeKey(base, target, sid, tid);

    const existing = latest.get(key);
    if (!existing || parseTime(rate.valid_from_date) > parseTime(existing.valid_from_date)) {
      latest.set(key, rate);
    }
  }

  const pairToRows = new Map<string, ExchangeRateRowInput[]>();
  for (const row of latest.values()) {
    const sourceCurrency = currencyById.get(row.source_currency_id);
    const destinationCurrency = currencyById.get(row.destination_currency_id);
    if (!sourceCurrency || !destinationCurrency) {
      continue;
    }
    const pairKey = `${sourceCurrency.CurrencyCode}/${destinationCurrency.CurrencyCode}`;
    if (!pairToRows.has(pairKey)) {
      pairToRows.set(pairKey, []);
    }
    pairToRows.get(pairKey)!.push(row);
  }

  const pairs: PairSnapshot[] = [];

  for (const [pairKey, rows] of pairToRows) {
    const [baseCurrency, targetCurrency] = pairKey.split("/");
    if (!baseCurrency || !targetCurrency) {
      continue;
    }

    const bySource = new Map<number, ExchangeRateRowInput[]>();
    for (const row of rows) {
      const sid = row.source_id ?? 0;
      if (!bySource.has(sid)) {
        bySource.set(sid, []);
      }
      bySource.get(sid)!.push(row);
    }

    const sourceSnapshots: SourceSnapshot[] = [];

    for (const [sourceId, sourceRows] of bySource) {
      const meta = sourceById.get(sourceId);
      const ratesByType: Record<number, number | null> = {};
      for (const t of columnTypes) {
        ratesByType[t.typeId] = null;
      }

      for (const row of sourceRows) {
        const tid = row.type_id ?? 0;
        const numeric = Number(row.rate_value);
        const value = Number.isFinite(numeric) && numeric > 0 ? numeric : null;
        ratesByType[tid] = value;
      }

      const countryName =
        meta?.SourceCountry?.Valid && meta.SourceCountry.String
          ? meta.SourceCountry.String
          : countryByCurrencyId.get(sourceRows[0]?.source_currency_id ?? 0) ?? null;

      sourceSnapshots.push({
        sourceId,
        sourceCode: meta?.SourceName ?? `source-${sourceId}`,
        sourceName: meta?.SourceName ?? `Source ${sourceId}`,
        sourceCountry: countryName,
        updatedAt: sourceRows
          .map((r) => r.valid_from_date)
          .filter(Boolean)
          .sort()
          .at(-1),
        rates: ratesByType,
      });
    }

    sourceSnapshots.sort((a, b) => a.sourceName.localeCompare(b.sourceName));

    pairs.push({
      baseCurrency,
      targetCurrency,
      types: columnTypes,
      sources: sourceSnapshots,
    });
  }

  pairs.sort((a, b) => {
    const ak = `${a.baseCurrency}/${a.targetCurrency}`;
    const bk = `${b.baseCurrency}/${b.targetCurrency}`;
    return ak.localeCompare(bk);
  });

  return pairs;
}
