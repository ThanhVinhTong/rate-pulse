"use client";

import { Copy, ExternalLink, RotateCcw } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FieldCaption } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";
import {
  EXCHANGE_RATES_LIMIT,
  DEFAULT_SOURCE_CURRENCY_ID,
  DEFAULT_TARGET_CURRENCY_CODE,
  type Currency,
  type ExchangeRateLatest,
  type RateSourceMetadata,
} from "@/types/exchange-rates";

type GoNullString = { String: string; Valid: boolean };
type GoNullInt32 = { Int32: number; Valid: boolean };

type ConverterClientProps = {
  apiBase: string;
  currencies: Currency[];
  rateSources: RateSourceMetadata[];
};

type ConverterCardProps = {
  title: string;
  subtitle: string;
  amount: string;
  onAmountChange: (value: string) => void;
  inputCurrency: string;
  outputCurrency: string;
  resultLabel: string;
  rateData: SnapshotBest;
  type: "buy" | "sell";
};

function wireString(v: string | GoNullString | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object" && v.Valid && typeof v.String === "string") {
    return v.String.trim();
  }
  return "";
}

function wireInt32(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") {
    const o = v as Partial<GoNullInt32>;
    if (o.Valid === true && typeof o.Int32 === "number") return o.Int32;
  }
  return null;
}

function currencyLabel(currency: Currency): string {
  return `${currency.CurrencyCode} - ${currency.CurrencyName}`;
}

const BUY_TRANSFER_TYPES = new Set([
  "buy transfer",
  "receive imt",
]);
const SELL_TRANSFER_TYPES = new Set([
  "sell transfer",
  "sell cash/transfer",
  "send imt",
]);

function rateSourceKey(rate: ExchangeRateLatest): string {
  return rate.RateSourceCode?.Valid ? rate.RateSourceCode.String : "UNKNOWN";
}

function rateType(rate: ExchangeRateLatest): string {
  return wireString(rate.TypeName).toLowerCase();
}

function formatRate(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";

  return n.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

function safeExternalHref(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

type SnapshotBest = {
  value: number;
  displayValue: string;
  bank: string;
  sourceCode: string;
  sourceLink: string;
} | null;

function ConverterCard({
  title,
  subtitle,
  amount,
  onAmountChange,
  inputCurrency,
  outputCurrency,
  resultLabel,
  rateData,
  type,
}: ConverterCardProps) {
  const hasAmount = amount.trim().length > 0;
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  const convertedAmount = (() => {
    if (!hasAmount || !rateData) return "-";
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount)) return "-";
    
    const result = type === "buy" 
      ? numAmount * rateData.value 
      : numAmount / rateData.value;
    
    if (result < 1) {
      return result.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumSignificantDigits: 2,
      });
    }
    return result.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  })();

  const handleCopyResult = async () => {
    if (convertedAmount === "-") return;
    
    try {
      await navigator.clipboard.writeText(convertedAmount);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Panel variant="sheet" padding="md" className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Heading level="h3">{title}</Heading>
          <Text variant="caption" className="mt-1">
            {subtitle}
          </Text>
        </div>
        <Badge variant="muted">{inputCurrency}</Badge>
      </div>

      <label className="block">
        <FieldCaption variant="upper">Amount</FieldCaption>
        <div className="mt-2 flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            className="flex-1"
          />
          <div className="flex h-10 min-w-16 items-center justify-center rounded-md border border-border bg-panel px-3 text-sm font-semibold text-text-primary">
            {inputCurrency}
          </div>
        </div>
      </label>

      <Panel variant="inset" padding="sm">
        <Text variant="caption">{resultLabel}</Text>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold text-primary tabular-nums">
            {convertedAmount}
          </p>
          <Badge>{outputCurrency}</Badge>
        </div>
        <Text variant="caption" className="mt-2">
          {hasAmount && rateData
            ? `Rate used: ${rateData.displayValue} · Bank: ${rateData.sourceCode}`
            : "Enter an amount to preview the conversion."}
        </Text>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant="converterButton" 
          onClick={handleCopyResult}
          disabled={convertedAmount === "-"}
          title={copyFeedback ? "Copied!" : "Copy result to clipboard"}
        >
          <Copy className="h-4 w-4" aria-hidden />
          {copyFeedback ? "Copied!" : "Copy result"}
        </Button>
      </div>

      <Text variant="caption">
        Indicative only. Final rates may vary by fees, channel, and settlement time.
      </Text>
    </Panel>
  );
}

function SnapshotTile({
  label,
  value,
  bank,
  sourceCode,
  sourceLink,
  tone,
}: {
  label: string;
  value: string;
  bank: string;
  sourceCode: string;
  sourceLink: string;
  tone: "buy" | "sell";
}) {
  return (
    <Panel variant="inset" padding="sm">
      <div className="flex items-center justify-between gap-3">
        <Text variant="caption">{label}</Text>
        <Badge variant={tone === "buy" ? "success" : "warning"}>
          {tone === "buy" ? "Best buy" : "Best sell"}
        </Badge>
      </div>
      <p className="mt-3 text-3xl font-semibold text-text-primary tabular-nums">
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="muted">{sourceCode || "-"}</Badge>
        <Text variant="caption" className="font-medium text-text-primary">
          {bank}
        </Text>
      </div>
      {sourceLink ? (
        <a
          href={safeExternalHref(sourceLink)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Visit source
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      ) : (
        <Text variant="caption" className="mt-2">
          Source link: -
        </Text>
      )}
    </Panel>
  );
}

export function ConverterClient({ apiBase, currencies, rateSources }: ConverterClientProps) {
  const sortedCurrencies = useMemo(
    () =>
      [...currencies].sort((a, b) =>
        a.CurrencyCode.localeCompare(b.CurrencyCode),
      ),
    [currencies],
  );

  const initialBaseCurrencyId =
    sortedCurrencies.find((c) => c.CurrencyID === DEFAULT_SOURCE_CURRENCY_ID)?.CurrencyID ??
    sortedCurrencies[0]?.CurrencyID ??
    0;
  const initialTargetCurrencyCode =
    sortedCurrencies.find((c) => c.CurrencyCode === DEFAULT_TARGET_CURRENCY_CODE && c.CurrencyID !== initialBaseCurrencyId)
      ?.CurrencyCode ??
    sortedCurrencies.find((c) => c.CurrencyID !== initialBaseCurrencyId)?.CurrencyCode ??
    sortedCurrencies[0]?.CurrencyCode ??
    "";

  const [baseCurrencyId, setBaseCurrencyId] = useState(initialBaseCurrencyId);
  const [targetCurrencyCode, setTargetCurrencyCode] = useState(initialTargetCurrencyCode);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  const [latestRates, setLatestRates] = useState<ExchangeRateLatest[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const baseCurrency = useMemo(
    () => sortedCurrencies.find((currency) => currency.CurrencyID === baseCurrencyId),
    [baseCurrencyId, sortedCurrencies],
  );

  const baseCurrencyCode = baseCurrency?.CurrencyCode ?? "-";

  useEffect(() => {
    if (!baseCurrencyId) return;
  
    let cancelled = false;
  
    async function loadLatestRates() {
      setSnapshotLoading(true);
      setSnapshotError(null);
  
      try {
        const res = await fetch(
          `${apiBase}/exchange-rates-latest?source_currency_id=${baseCurrencyId}&limit=${EXCHANGE_RATES_LIMIT}`,
          { cache: "no-store" },
        );
  
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
  
        const data: unknown = await res.json();
  
        if (!cancelled) {
          setLatestRates(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setLatestRates([]);
          setSnapshotError(error instanceof Error ? error.message : "Failed to load latest rates");
        }
      } finally {
        if (!cancelled) {
          setSnapshotLoading(false);
        }
      }
    }
  
    void loadLatestRates();
  
    return () => {
      cancelled = true;
    };
  }, [apiBase, baseCurrencyId]);

  const bankOptions = useMemo(() => {
    const options = rateSources
      .filter((source) => wireInt32(source.CurrencyID) === baseCurrencyId)
      .map((source) => {
        const code = wireString(source.SourceCode);
        if (!code) return null;

        return {
          code,
          label: `${code} - ${source.SourceName}`,
        };
      })
      .filter(Boolean) as { code: string; label: string }[];

    return options.sort((a, b) => a.code.localeCompare(b.code));
  }, [baseCurrencyId, rateSources]);

  const targetCurrencies = useMemo(
    () =>
      sortedCurrencies.filter(
        (currency) => currency.CurrencyID !== baseCurrencyId,
      ),
    [baseCurrencyId, sortedCurrencies],
  );

  const sourceMetaByCode = useMemo(() => {
    const map = new Map<string, { name: string; link: string }>();
  
    for (const source of rateSources) {
      const code = wireString(source.SourceCode);
      if (!code) continue;
  
      map.set(code, {
        name: source.SourceName,
        link: wireString(source.SourceLink),
      });
    }
  
    return map;
  }, [rateSources]);
  
  const snapshotRates = useMemo(
    () =>
      latestRates.filter((rate) => {
        if (targetCurrencyCode && rate.DestinationCurrencyCode !== targetCurrencyCode) {
          return false;
        }
  
        return true;
      }),
    [latestRates, targetCurrencyCode],
  );

  const findBestRate = (
    typeSet: Set<string>,
    compareFunc: (current: number, best: number) => boolean,
    bankCode?: string,
  ): SnapshotBest => {
    let best: SnapshotBest = null;

    for (const rate of snapshotRates) {
      if (!typeSet.has(rateType(rate))) continue;
      if (bankCode && rateSourceKey(rate) !== bankCode) continue;

      const value = Number(rate.RateValue);
      if (!Number.isFinite(value)) continue;

      if (!best || compareFunc(value, best.value)) {
        const sourceCode = rateSourceKey(rate);
        best = {
          value,
          displayValue: formatRate(rate.RateValue),
          bank: sourceMetaByCode.get(sourceCode)?.name ?? sourceCode,
          sourceCode,
          sourceLink: sourceMetaByCode.get(sourceCode)?.link ?? "",
        };
      }
    }

    return best;
  };
  
  const bestBuy = useMemo<SnapshotBest>(
    () => findBestRate(BUY_TRANSFER_TYPES, (current, best) => current > best, selectedBankCode),
    [snapshotRates, sourceMetaByCode, selectedBankCode],
  );
  
  const bestSell = useMemo<SnapshotBest>(
    () => findBestRate(SELL_TRANSFER_TYPES, (current, best) => current < best, selectedBankCode),
    [snapshotRates, sourceMetaByCode, selectedBankCode],
  );

  const bestBuyAllBanks = useMemo<SnapshotBest>(
    () => findBestRate(BUY_TRANSFER_TYPES, (current, best) => current > best),
    [snapshotRates, sourceMetaByCode],
  );

  const bestSellAllBanks = useMemo<SnapshotBest>(
    () => findBestRate(SELL_TRANSFER_TYPES, (current, best) => current < best),
    [snapshotRates, sourceMetaByCode],
  );

  const selectClass =
    "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm transition " +
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  function handleBaseCurrencyChange(value: string) {
    const nextBaseId = Number(value);
    if (!Number.isFinite(nextBaseId) || nextBaseId <= 0) return;

    setBaseCurrencyId(nextBaseId);
    setSelectedBankCode("");

    const nextTarget =
      sortedCurrencies.find((currency) => currency.CurrencyID !== nextBaseId)
        ?.CurrencyCode ?? "";

    setTargetCurrencyCode(nextTarget);
  }

  function resetConverter() {
    setSelectedBankCode("");
    setBuyAmount("");
    setSellAmount("");
  }

  return (
    <div className="space-y-6">
      <Panel variant="sheet" padding="md" aria-label="Converter filters">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Text variant="overlineBrand">Converter</Text>
            <Heading level="section" className="mt-2">
              Compare buy and sell transfer rates
            </Heading>
            <Text variant="muted" className="mt-2 max-w-2xl">
              Choose a bank, base currency, and target currency. Rate calculations and market bests can be wired to the
              latest data later.
            </Text>
          </div>

          <Button variant="converterButton" onClick={resetConverter}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block">
            <FieldCaption variant="upper">Bank</FieldCaption>
            <select
              className={selectClass}
              value={selectedBankCode}
              onChange={(event) => setSelectedBankCode(event.target.value)}
            >
              <option value="">All banks</option>
              {bankOptions.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldCaption variant="upper">Base currency</FieldCaption>
            <select
              className={selectClass}
              value={baseCurrencyId}
              onChange={(event) => handleBaseCurrencyChange(event.target.value)}
            >
              {sortedCurrencies.map((currency) => (
                <option key={currency.CurrencyID} value={currency.CurrencyID}>
                  {currencyLabel(currency)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldCaption variant="upper">Target currency</FieldCaption>
            <select
              className={selectClass}
              value={targetCurrencyCode}
              onChange={(event) => setTargetCurrencyCode(event.target.value)}
            >
              {targetCurrencies.map((currency) => (
                <option key={currency.CurrencyID} value={currency.CurrencyCode}>
                  {currencyLabel(currency)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConverterCard
          title="Buy transfer"
          subtitle="You pay with the target currency and receive the base currency."
          amount={buyAmount}
          onAmountChange={setBuyAmount}
          inputCurrency={targetCurrencyCode || "-"}
          outputCurrency={baseCurrencyCode}

          resultLabel="Estimated target amount"
          rateData={bestBuy}
          type="buy"
        />

        <ConverterCard
          title="Sell transfer"
          subtitle="You sell the base currency and receive the target currency."
          amount={sellAmount}
          onAmountChange={setSellAmount}
          inputCurrency={baseCurrencyCode}
          outputCurrency={targetCurrencyCode || "-"}
          resultLabel="Estimated base amount"
          rateData={bestSell}
          type="sell"
        />
      </div>

      <Panel variant="sheet" padding="md" aria-label="Latest market snapshot">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <Heading level="h3">Latest snapshot</Heading>
            <Text variant="muted" className="mt-1">
              Best available buy and sell transfer rates across banks for{" "}
              {baseCurrencyCode} to {targetCurrencyCode || "-"}.
            </Text>
            {snapshotError ? (
              <Text variant="error" className="mt-2">
                {snapshotError}
              </Text>
            ) : null}
          </div>
          <Text variant="caption">
            {snapshotLoading ? "Refreshing..." : `${snapshotRates.length} latest quotes`}
          </Text>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SnapshotTile
            label="Maximum buy among all banks"
            value={snapshotLoading ? "-" : bestBuyAllBanks?.displayValue ?? "-"}
            bank={snapshotLoading ? "-" : bestBuyAllBanks?.bank ?? "-"}
            sourceCode={snapshotLoading ? "" : bestBuyAllBanks?.sourceCode ?? ""}
            sourceLink={snapshotLoading ? "" : bestBuyAllBanks?.sourceLink ?? ""}
            tone="buy"
          />

          <SnapshotTile
            label="Minimum sell among all banks"
            value={snapshotLoading ? "-" : bestSellAllBanks?.displayValue ?? "-"}
            bank={snapshotLoading ? "-" : bestSellAllBanks?.bank ?? "-"}
            sourceCode={snapshotLoading ? "" : bestSellAllBanks?.sourceCode ?? ""}
            sourceLink={snapshotLoading ? "" : bestSellAllBanks?.sourceLink ?? ""}
            tone="sell"
          />
        </div>
      </Panel>
    </div>
  );
}
