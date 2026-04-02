"use client";

import { ArrowRightLeft } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldCaption } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyConverterProps {
  baseCurrency: string;
  targetCurrency: string;
  conversionRate: number;
  currencyOptions: CurrencyOption[];
  updatedAt?: string;
}

export function CurrencyConverter({
  baseCurrency,
  targetCurrency,
  conversionRate,
  currencyOptions,
  updatedAt = "N/A",
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState("1");
  const [isSwapped, setIsSwapped] = useState(false);

  const rate = Number.isFinite(conversionRate) && conversionRate > 0 ? conversionRate : 1;
  const displayRate = rate > 0 ? 1 / rate : 1;
  const fromCurrency = isSwapped ? targetCurrency : baseCurrency;
  const toCurrency = isSwapped ? baseCurrency : targetCurrency;
  const activeRate = isSwapped ? rate : displayRate;
  const convertedAmount = useMemo(
    () =>
      (Number(amount || 0) * activeRate).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
    [amount, activeRate],
  );

  const currencyByCode = useMemo(
    () => new Map(currencyOptions.map((currency) => [currency.code, currency])),
    [currencyOptions],
  );

  const fromDetails = currencyByCode.get(fromCurrency) || {
    code: fromCurrency,
    name: fromCurrency,
    symbol: fromCurrency,
  };
  const toDetails = currencyByCode.get(toCurrency) || {
    code: toCurrency,
    name: toCurrency,
    symbol: toCurrency,
  };

  return (
    <Panel variant="sheet" padding="md" className="mb-6">
      <Heading level="section" className="mb-6 text-xl">
        Currency Converter
      </Heading>

      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="w-full flex-1">
          <FieldCaption variant="upper">FROM</FieldCaption>
          <Panel variant="converterBox">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-oninset">{fromDetails.symbol}</span>
              <div>
                <div className="font-bold text-oninset">{fromCurrency}</div>
                <div className="text-xs text-oninset-muted">{fromDetails.name}</div>
              </div>
            </div>
            <Input
              type="number"
              variant="ghostNumber"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </Panel>
        </div>

        <div className="mt-6 flex-shrink-0 md:mt-0">
          <Button type="button" variant="iconSquare" onClick={() => setIsSwapped((current) => !current)}>
            <ArrowRightLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="w-full flex-1">
          <FieldCaption variant="upper">TO</FieldCaption>
          <Panel variant="converterBox">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-oninset">{toDetails.symbol}</span>
              <div>
                <div className="font-bold text-oninset">{toCurrency}</div>
                <div className="text-xs text-oninset-muted">{toDetails.name}</div>
              </div>
            </div>
            <div className="w-full truncate bg-transparent text-2xl font-semibold text-sky-300 outline-none dark:text-sky-200">
              {convertedAmount}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Text variant="muted" className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          Live rate: 1 {fromCurrency} = {activeRate.toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
          {toCurrency}
        </Text>
        <Text variant="caption" className="text-text-tertiary">
          {updatedAt}
        </Text>
      </div>
    </Panel>
  );
}
