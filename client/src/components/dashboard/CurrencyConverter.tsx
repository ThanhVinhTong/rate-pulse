"use client";

import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";

const currencies = {
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  USD: { code: "USD", name: "US Dollar", symbol: "$" },
  EUR: { code: "EUR", name: "Euro", symbol: "€" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£" },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
};

interface CurrencyConverterProps {
  baseCurrency: string;
  targetCurrency: string;
}

// Simple mock conversion rate function
const getConversionRate = (from: string, to: string) => {
  if (from === "VND" && to === "USD") return 0.00003935;
  if (from === "USD" && to === "VND") return 25410.00;
  // Fallback for others
  return 1.5; 
};

export function CurrencyConverter({ baseCurrency, targetCurrency }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState(baseCurrency);
  const [toCurrency, setToCurrency] = useState(targetCurrency);
  const [amount, setAmount] = useState("1");

  const rate = getConversionRate(fromCurrency, toCurrency);
  const convertedAmount = (Number(amount || 0) * rate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const fromDetails = currencies[fromCurrency as keyof typeof currencies] || currencies.USD;
  const toDetails = currencies[toCurrency as keyof typeof currencies] || currencies.VND;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-6">Currency Converter</h2>
      
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* FROM Box */}
        <div className="w-full flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">FROM</label>
          <div className="rounded-xl border border-white/10 bg-[#0c1220] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">{fromCurrency.substring(0,2)}</span>
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
            onClick={handleSwap}
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
              <span className="text-lg font-semibold text-white">{toCurrency.substring(0,2)}</span>
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
          Live rate: 1 {fromCurrency} = {rate.toLocaleString('en-US', { maximumFractionDigits: 6 })} {toCurrency}
        </p>
        <p className="text-xs text-text-tertiary">
          Mar 10, 9:13 PM GMT+8
        </p>
      </div>
    </div>
  );
}
