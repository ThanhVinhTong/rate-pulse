"use client";

import { ArrowRightLeft } from "lucide-react";
import { useMemo, useState } from "react";

const currencies: Record<string, { code: string; name: string; symbol: string }> = {
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "VND" },
  USD: { code: "USD", name: "US Dollar", symbol: "$" },
  EUR: { code: "EUR", name: "Euro", symbol: "€" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£" },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "CNY" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿" },
};

interface CurrencyConverterProps {
  baseCurrency: string;
  targetCurrency: string;
  conversionRate: number;
  onSwapCurrencies: () => void;
}

export function CurrencyConverter({
  baseCurrency,
  targetCurrency,
  conversionRate,
  onSwapCurrencies,
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState("1");

  const rate = Number.isFinite(conversionRate) && conversionRate > 0 ? conversionRate : 1;
  const convertedAmount = useMemo(
    () =>
      (Number(amount || 0) * rate).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
    [amount, rate],
  );

  const fromDetails = currencies[baseCurrency] || { code: baseCurrency, name: baseCurrency, symbol: baseCurrency };
  const toDetails = currencies[targetCurrency] || { code: targetCurrency, name: targetCurrency, symbol: targetCurrency };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-6">Currency Converter</h2>
      
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* FROM Box */}
        <div className="w-full flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">FROM</label>
          <div className="rounded-xl border border-white/10 bg-[#0c1220] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">{baseCurrency.substring(0, 2)}</span>
              <div>
                <div className="font-bold text-white">{baseCurrency}</div>
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
            onClick={onSwapCurrencies}
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
              <span className="text-lg font-semibold text-white">{targetCurrency.substring(0, 2)}</span>
              <div>
                <div className="font-bold text-white">{targetCurrency}</div>
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
          Live rate: 1 {baseCurrency} = {rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} {targetCurrency}
        </p>
        <p className="text-xs text-text-tertiary">
          Mar 10, 9:13 PM GMT+8
        </p>
      </div>
    </div>
  );
}
