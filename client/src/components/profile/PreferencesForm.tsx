"use client";

import type { AuthSession } from "@/types";
import { Select } from "@/components/ui/Select";

export function PreferencesForm() {

  // In a real implementation you would use useActionState similar to ProfileForm
  return (
    <form className="mt-8 space-y-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-transparent dark:p-0 dark:shadow-none">
        <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Currency Preferences</h2>
            
            <div className="space-y-6">
            <label className="block space-y-2">
                <span className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-text-muted">Primary Currency</span>
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
                <span className="block text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-text-muted">Favorite Currency Pairs</span>
                <div className="flex flex-wrap gap-3">
                {['USD/EUR', 'GBP/USD', 'USD/JPY', 'EUR/GBP', 'AUD/USD'].map((pair) => (
                    <button
                    key={pair}
                    type="button"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-[#0c1220] dark:text-white dark:hover:bg-white/5"
                    >
                    {pair}
                    </button>
                ))}
                <button
                    type="button"
                    className="rounded-xl border border-dashed border-gray-300 px-5 py-2 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white"
                >
                    + Add Pair
                </button>
                </div>
            </div>
            </div>
        </div>

      <div className="flex justify-end pt-4">
        {/* If the button component doesn't support generic children, you can use a native button here */}
        <button
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          type="submit"
        >
          Save Preferences
        </button>
      </div>
    </form>
  );
}
