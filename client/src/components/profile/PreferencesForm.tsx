"use client";

import { useActionState } from "react";

import { updateCurrencyPreferenceAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { FieldLabel, FieldCaption } from "@/components/ui/label";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Text } from "@/components/ui/typography";

interface PreferencesFormProps {
  currencies: Array<{
    currencyId: number;
    currencyCode: string;
    currencyName: string;
    currencySymbol?: string;
  }>;
  selectedCurrencyId: number | null;
}

export function PreferencesForm({ currencies, selectedCurrencyId }: PreferencesFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateCurrencyPreferenceAction,
    initialActionState,
  );

  return (
    <form
      action={formAction}
      className="mt-8 space-y-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-transparent dark:p-0 dark:shadow-none"
    >
        <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Currency Preferences</h2>
            
            <div className="space-y-6">
            <FieldLabel>
                <FieldCaption>Primary Currency</FieldCaption>
                <Select
                    name="primaryCurrencyId"
                    defaultValue={selectedCurrencyId !== null ? String(selectedCurrencyId) : ""}
                >
                    <option value="">Choose your perfer currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.currencyId} value={String(currency.currencyId)}>
                        {currency.currencySymbol ? `${currency.currencySymbol} ` : ""}
                        {currency.currencyCode} - {currency.currencyName}
                      </option>
                    ))}
                </Select>
            </FieldLabel>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-white/10 dark:bg-[#0c1220]">
              <input
                type="checkbox"
                name="isPrimary"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-text-muted">
                Keep this as Base currency
              </span>
            </label>

            
            </div>
        </div>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {state.status === "success" ? (
            <Text className="text-sm text-status-success">{state.message}</Text>
          ) : null}
          {state.status === "error" ? (
            <Text className="text-sm text-status-danger">{state.message}</Text>
          ) : null}
        </div>
        <SubmitButton pendingLabel="Saving preference...">Save Preferences</SubmitButton>
      </div>
    </form>
  );
}
