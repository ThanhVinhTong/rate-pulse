import type { Currency, ExchangeRateLatest, RateSourceMetadata } from "@/types/exchange-rates";

export interface ExchangeRateTypeWire {
  TypeID?: number;
  TypeName?: string;
  type_id?: number;
  type_name?: string;
}

export interface RateSourceFeeRule {
  fee_rule_id: number;
  source_id: number;
  type_id: number;
  transaction_type: "transfer" | "cash" | "cheque" | "card" | "unknown";
  channel: string;
  fee_rate: string | null;
  fee_rate_min: string | null;
  fee_rate_max: string | null;
  fee_currency_id: number | null;
  fixed_fee: string | null;
  min_fee: string | null;
  max_fee: string | null;
  vat_rate: string;
  vat_applies: "true" | "false" | "unknown";
  fee_includes_vat: boolean;
  swift_fee: string | null;
  swift_fee_currency_id: number | null;
  swift_fee_included: boolean;
  source_url: string | null;
  source_note: string | null;
  effective_from: string;
  effective_to: string | null;
  updated_at: string | null;
  created_at: string | null;
}

export type FeeMatch =
  | {
      status: "matched";
      rule: RateSourceFeeRule;
      transactionType: RateSourceFeeRule["transaction_type"];
      typeId: number;
    }
  | {
      status: "no-transfer-fee";
      transactionType: RateSourceFeeRule["transaction_type"];
      typeId: number | null;
    }
  | {
      status: "unavailable";
      reason: string;
      transactionType: RateSourceFeeRule["transaction_type"];
      typeId: number | null;
    };

export type ConversionDirection = "buy" | "sell";

export interface FeeAdjustedConversion {
  adjustedValue: number;
  adjustedValueMin?: number;
  adjustedValueMax?: number;
  comparisonValue: number;
  feeSummary: string;
  isRange: boolean;
}

export interface FeeRuleContext {
  feeRules: RateSourceFeeRule[];
  rateSources: RateSourceMetadata[];
  exchangeRateTypes: ExchangeRateTypeWire[];
  currencies: Currency[];
}

export interface FeeAdjustedConversionInput extends FeeRuleContext {
  rate: ExchangeRateLatest;
  allRates: ExchangeRateLatest[];
  amount: number;
  direction: ConversionDirection;
}
