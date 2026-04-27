"use client";

import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function PreferencesForm() {

  // In a real implementation you would use useActionState similar to ProfileForm
  return (
    <form className="mt-8 space-y-8">
        <div>
            <h2 className="mb-6 text-xl font-semibold text-text-primary">Currency Preferences</h2>
            
            <div className="space-y-6">
            <label className="block space-y-2">
                <span className="text-sm font-medium text-text-muted">Primary Currency</span>
                <Select
                    name="primaryCurrency"
                    defaultValue="JPY"
                >
                    <option value="USD">$ USD - US Dollar</option>
                    <option value="EUR">€ EUR - Euro</option>
                    <option value="GBP">£ GBP - British Pound</option>
                    <option value="JPY">¥ JPY - Japanese Yen</option>
                    <option value="AUD">$ AUD - Australian Dollar</option>
                </Select>
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
