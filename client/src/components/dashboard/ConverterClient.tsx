"use client";

import { ArrowRightLeft, Copy, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FieldCaption } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";
import type { Currency, RateSourceMetadata } from "@/types/exchange-rates";

type GoNullString = { String: string; Valid: boolean };
type GoNullInt32 = { Int32: number; Valid: boolean };

type ConverterClientProps = {
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

function ConverterCard({
  title,
  subtitle,
  amount,
  onAmountChange,
  inputCurrency,
  outputCurrency,
  resultLabel,
}: ConverterCardProps) {
  const hasAmount = amount.trim().length > 0;

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
            {hasAmount ? "-" : "-"}
          </p>
          <Badge>{outputCurrency}</Badge>
        </div>
        <Text variant="caption" className="mt-2">
          {hasAmount ? "Rate used: - · Bank: -" : "Enter an amount to preview the conversion."}
        </Text>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button variant="converterButton" disabled>
          <ArrowRightLeft className="h-4 w-4" aria-hidden />
          Swap
        </Button>
        <Button variant="converterButton" disabled>
          <Copy className="h-4 w-4" aria-hidden />
          Copy result
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
  tone,
}: {
  label: string;
  value: string;
  bank: string;
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
      <Text variant="caption" className="mt-2">
        Bank: {bank}
      </Text>
    </Panel>
  );
}

export function ConverterClient({ currencies, rateSources }: ConverterClientProps) {
  const sortedCurrencies = useMemo(
    () =>
      [...currencies].sort((a, b) =>
        a.CurrencyCode.localeCompare(b.CurrencyCode),
      ),
    [currencies],
  );

  const initialBaseCurrencyId = sortedCurrencies[0]?.CurrencyID ?? 0;
  const initialTargetCurrencyCode =
    sortedCurrencies.find((currency) => currency.CurrencyID !== initialBaseCurrencyId)
      ?.CurrencyCode ??
    sortedCurrencies[0]?.CurrencyCode ??
    "";

  const [baseCurrencyId, setBaseCurrencyId] = useState(initialBaseCurrencyId);
  const [targetCurrencyCode, setTargetCurrencyCode] = useState(initialTargetCurrencyCode);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  const baseCurrency = useMemo(
    () => sortedCurrencies.find((currency) => currency.CurrencyID === baseCurrencyId),
    [baseCurrencyId, sortedCurrencies],
  );

  const baseCurrencyCode = baseCurrency?.CurrencyCode ?? "-";

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
          subtitle="You pay with the base currency and receive the target currency."
          amount={buyAmount}
          onAmountChange={setBuyAmount}
          inputCurrency={baseCurrencyCode}
          outputCurrency={targetCurrencyCode || "-"}
          resultLabel="Estimated target amount"
        />

        <ConverterCard
          title="Sell transfer"
          subtitle="You sell the target currency and receive the base currency."
          amount={sellAmount}
          onAmountChange={setSellAmount}
          inputCurrency={targetCurrencyCode || "-"}
          outputCurrency={baseCurrencyCode}
          resultLabel="Estimated base amount"
        />
      </div>

      <Panel variant="sheet" padding="md" aria-label="Latest market snapshot">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <Heading level="h3">Latest snapshot</Heading>
            <Text variant="muted" className="mt-1">
              TODO: Wire max buy and min sell later.
            </Text>
          </div>
          <Text variant="caption">As of: -</Text>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SnapshotTile label="Maximum buy among all banks" value="-" bank="-" tone="buy" />
          <SnapshotTile label="Minimum sell among all banks" value="-" bank="-" tone="sell" />
        </div>
      </Panel>
    </div>
  );
}