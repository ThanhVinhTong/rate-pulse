"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CurrencySelect } from "@/components/profile/ProfileSelectors";
import type { Currency } from "@/types/exchange-rates";

interface PreferencesFormProps {
  currencies: Currency[];
}

export function PreferencesForm({ currencies }: PreferencesFormProps) {
  const [primaryCurrency, setPrimaryCurrency] = useState("JPY");

  // In a real implementation you would use useActionState similar to ProfileForm
  return (
    <form className="mt-8 space-y-8">
        <div>
            <h2 className="mb-6 text-xl font-semibold text-text-primary">Currency Preferences</h2>
            
            <div className="space-y-6">
            <label className="block space-y-2">
                <span className="text-sm font-medium text-text-muted">Primary Currency</span>
                <CurrencySelect
                    name="primaryCurrency"
                    defaultValue={primaryCurrency}
                    onChange={setPrimaryCurrency}
                    currencies={currencies}
                />
            </label>

            <div className="space-y-3">
                <span className="block text-sm font-medium text-text-muted">Favorite Currency Pairs</span>
                <div className="flex flex-wrap gap-3">
                {['USD/EUR', 'GBP/USD', 'USD/JPY', 'EUR/GBP', 'AUD/USD'].map((pair) => (
                    <button
                    key={pair}
                    type="button"
                    className="rounded-md border border-border bg-panel px-4 py-2 text-sm text-text-primary transition-colors hover:border-primary/40"
                    >
                    {pair}
                    </button>
                ))}
                <button
                    type="button"
                    className="rounded-md border border-dashed border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-primary/50 hover:text-text-primary"
                >
                    + Add Pair
                </button>
                </div>
            </div>
            </div>
        </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
