"use client";

import { useActionState } from "react";

import { updateSettingsAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";

import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LocalizationForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateSettingsAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-6 md:grid-cols-2">
      <input type="hidden" name="section" value="Localization & Data" />

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm text-text-muted">Timezone</span>
        <Select name="timezone" defaultValue="UTC">
          <option value="UTC">UTC — Coordinated Universal Time</option>
          <option value="EST">EST — Eastern Standard Time (UTC−5)</option>
          <option value="CST">CST — Central Standard Time (UTC−6)</option>
          <option value="MST">MST — Mountain Standard Time (UTC−7)</option>
          <option value="PST">PST — Pacific Standard Time (UTC−8)</option>
          <option value="GMT">GMT — Greenwich Mean Time</option>
          <option value="CET">CET — Central European Time (UTC+1)</option>
          <option value="JST">JST — Japan Standard Time (UTC+9)</option>
          <option value="AWST">AWST — Australian Western Standard Time (UTC+8)</option>
          <option value="AEST">AEST — Australian Eastern Standard Time (UTC+10)</option>
        </Select>
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm text-text-muted">Number Formatting</span>
        <Select name="numberFormat" defaultValue="1,234.56">
          <option value="1,234.56">1,234.56 — Comma thousands, dot decimal</option>
          <option value="1.234,56">1.234,56 — Dot thousands, comma decimal</option>
          <option value="1 234.56">1 234.56 — Space thousands, dot decimal</option>
          <option value="1 234,56">1 234,56 — Space thousands, comma decimal</option>
        </Select>
      </label>

      <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {state.status === "success" ? (
            <p className="text-sm text-status-success">{state.message}</p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm text-status-danger">{state.message}</p>
          ) : null}
        </div>
        <SubmitButton pendingLabel="Saving...">Save changes</SubmitButton>
      </div>
    </form>
  );
}
