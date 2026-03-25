"use client";

import { ArrowRightLeft } from "lucide-react";
import { useMemo, useState } from "react";

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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-6">Currency Converter</h2>
      
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* FROM Box */}
        <div className="w-full flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">FROM</label>
          <div className="rounded-xl border border-white/10 bg-[#0c1220] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">{fromDetails.symbol}</span>
              <div>
                <div className="font-bold text-white">{fromCurrency}</div>
                <div className="text-xs text-text-muted">{fromDetails.name}</div>
              </div>
            </div>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-semibold text-white outline-none"
              placeholder="0"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex-shrink-0 mt-6 md:mt-0">
          <button 
            onClick={() => setIsSwapped((current) => !current)}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <ArrowRightLeft className="h-5 w-5" />
          </button>
        </div>

        {/* TO Box */}
        <div className="w-full flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">TO</label>
          <div className="rounded-xl border border-white/10 bg-[#0c1220] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">{toDetails.symbol}</span>
              <div>
                <div className="font-bold text-white">{toCurrency}</div>
                <div className="text-xs text-text-muted">{toDetails.name}</div>
              </div>
            </div>
            <div className="w-full bg-transparent text-2xl font-semibold text-primary outline-none truncate">
              {convertedAmount}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-text-muted flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
          Live rate: 1 {fromCurrency} = {activeRate.toLocaleString("en-US", { maximumFractionDigits: 6 })} {toCurrency}
        </p>
        <p className="text-xs text-text-tertiary">
          {updatedAt}
        </p>
      </div>
    </div>
  );
}
