import type {
  ConversionDirection,
  ExchangeRateTypeWire,
  FeeAdjustedConversion,
  FeeAdjustedConversionInput,
  FeeMatch,
  FeeRuleContext,
  RateSourceFeeRule,
} from "@/types/fee-rules";
import type { Currency, ExchangeRateLatest, RateSourceMetadata } from "@/types/exchange-rates";

type GoNullString = { String: string; Valid: boolean };
type GoNullInt32 = { Int32: number; Valid: boolean };

const BUY_TRANSFER_TYPES = new Set(["buy transfer", "receive imt"]);
const SELL_TRANSFER_TYPES = new Set(["sell transfer", "sell cash/transfer", "send imt"]);

export function wireString(v: string | GoNullString | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object" && v.Valid && typeof v.String === "string") {
    return v.String.trim();
  }
  return "";
}

export function wireInt32(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") {
    const o = v as Partial<GoNullInt32>;
    if (typeof o.Int32 === "number" && o.Valid === true) return o.Int32;
  }
  return null;
}

export function rateSourceKey(rate: ExchangeRateLatest): string {
  return rate.RateSourceCode && rate.RateSourceCode.trim() ? rate.RateSourceCode : "UNKNOWN";
}

export function rateTypeName(rate: ExchangeRateLatest): string {
  return wireString(rate.TypeName).toLowerCase();
}

export function normalizeExchangeRateTypes(types: ExchangeRateTypeWire[]) {
  return types
    .map((type) => ({
      typeId: type.TypeID ?? type.type_id ?? 0,
      typeName: (type.TypeName ?? type.type_name ?? "").trim(),
    }))
    .filter((type) => type.typeId > 0 && type.typeName !== "");
}

export function buildCurrencyCodeById(currencies: Currency[]): Map<number, string> {
  return new Map(currencies.map((currency) => [currency.CurrencyID, currency.CurrencyCode]));
}

function buildSourceIdByCode(rateSources: RateSourceMetadata[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const source of rateSources) {
    const code = wireString(source.SourceCode);
    if (code) map.set(code, source.SourceID);
  }
  return map;
}

function buildTypeIdByName(types: ExchangeRateTypeWire[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const type of normalizeExchangeRateTypes(types)) {
    map.set(type.typeName.toLowerCase(), type.typeId);
  }
  return map;
}

function transactionTypeForRateType(typeName: string): RateSourceFeeRule["transaction_type"] {
  if (typeName.includes("card")) return "card";
  if (typeName.includes("transfer") || typeName.includes("imt")) return "transfer";
  if (typeName.includes("cheque")) return "cheque";
  if (typeName.includes("cash")) return "cash";
  return "unknown";
}

function directionForRateType(typeName: string): "inbound" | "outbound" | null {
  if (BUY_TRANSFER_TYPES.has(typeName)) return "inbound";
  if (SELL_TRANSFER_TYPES.has(typeName)) return "outbound";
  if (typeName.startsWith("buy ")) return "inbound";
  if (typeName.startsWith("sell ")) return "outbound";
  return null;
}

function candidateChannels(rate: ExchangeRateLatest, transactionType: RateSourceFeeRule["transaction_type"]) {
  const destination = rate.DestinationCurrencyCode.toLowerCase();
  const direction = directionForRateType(rateTypeName(rate));

  const candidates = new Set<string>();
  if (direction) {
    candidates.add(`${direction}_${destination}`);
    candidates.add(direction);
  }
  if (transactionType !== "unknown") {
    candidates.add(`${transactionType}_${destination}`);
    candidates.add(transactionType);
  }
  candidates.add("default");
  return Array.from(candidates);
}

export function matchFeeRuleForRate(rate: ExchangeRateLatest, context: FeeRuleContext): FeeMatch {
  const typeName = rateTypeName(rate);
  const transactionType = transactionTypeForRateType(typeName);
  const typeId = buildTypeIdByName(context.exchangeRateTypes).get(typeName) ?? null;

  if (transactionType === "cash" || transactionType === "cheque") {
    return { status: "no-transfer-fee", transactionType, typeId };
  }

  if (!typeId) {
    return {
      status: "unavailable",
      reason: "missing rate type mapping",
      transactionType,
      typeId,
    };
  }

  const sourceId = buildSourceIdByCode(context.rateSources).get(rateSourceKey(rate));
  if (!sourceId) {
    return {
      status: "unavailable",
      reason: "missing source mapping",
      transactionType,
      typeId,
    };
  }

  const compatible = context.feeRules.filter(
    (rule) =>
      rule.source_id === sourceId &&
      rule.type_id === typeId &&
      rule.transaction_type === transactionType,
  );
  if (compatible.length === 0) {
    return {
      status: "unavailable",
      reason: "no matching fee rule",
      transactionType,
      typeId,
    };
  }

  const channels = candidateChannels(rate, transactionType);
  for (const channel of channels) {
    const match = compatible.find((rule) => rule.channel.toLowerCase() === channel);
    if (match) return { status: "matched", rule: match, transactionType, typeId };
  }

  return { status: "matched", rule: compatible[0], transactionType, typeId };
}

export function formatFeeMatch(match: FeeMatch, currencies: Currency[]): string {
  if (match.status === "no-transfer-fee") return "No transfer fee";
  if (match.status === "unavailable") return "Fee unavailable";
  return formatFeeRule(match.rule, currencies);
}

export function formatFeeRule(rule: RateSourceFeeRule, currencies: Currency[]): string {
  const currencyById = buildCurrencyCodeById(currencies);
  const parts: string[] = [];

  const rate = formatRatePart(rule);
  if (rate) parts.push(rate);

  if (hasNumber(rule.fixed_fee)) {
    parts.push(`${formatAmount(rule.fixed_fee)} ${currencyById.get(rule.fee_currency_id ?? 0) ?? ""}`.trim());
  }

  const feeCurrency = currencyById.get(rule.fee_currency_id ?? 0) ?? "";
  const minMax = formatMinMax(rule.min_fee, rule.max_fee, feeCurrency);
  if (minMax) parts.push(minMax);

  if (hasNumber(rule.swift_fee) && !rule.swift_fee_included) {
    const swiftCurrency = currencyById.get(rule.swift_fee_currency_id ?? 0) ?? "";
    parts.push(`+ ${formatAmount(rule.swift_fee)} ${swiftCurrency} SWIFT`.trim());
  } else if (rule.swift_fee_included) {
    parts.push("SWIFT included");
  }

  if (rule.vat_applies === "true") {
    parts.push(rule.fee_includes_vat ? "VAT included" : "+ VAT");
  } else if (rule.vat_applies === "unknown") {
    parts.push("VAT unknown");
  }

  if (parts.length === 0) return "Free";
  return parts.join(", ");
}

export function calculateFeeAdjustedConversion(input: FeeAdjustedConversionInput): FeeAdjustedConversion | null {
  const match = matchFeeRuleForRate(input.rate, input);
  const rateValue = Number(input.rate.RateValue);
  if (!Number.isFinite(rateValue) || rateValue <= 0 || input.amount <= 0) return null;

  const rawOutput = input.direction === "buy" ? input.amount * rateValue : input.amount / rateValue;

  if (match.status === "no-transfer-fee") {
    return {
      adjustedValue: rawOutput,
      comparisonValue: rawOutput,
      feeSummary: "No transfer fee",
      isRange: false,
    };
  }
  if (match.status !== "matched") return null;

  const feeBase = estimateFeeInBaseCurrency({
    rule: match.rule,
    input,
    rawOutput,
    rateValue,
  });
  if (!feeBase) return null;

  const adjustedMin =
    input.direction === "buy"
      ? Math.max(0, rawOutput - feeBase.maxBase)
      : Math.max(0, (input.amount - feeBase.maxBase) / rateValue);
  const adjustedMax =
    input.direction === "buy"
      ? Math.max(0, rawOutput - feeBase.minBase)
      : Math.max(0, (input.amount - feeBase.minBase) / rateValue);

  return {
    adjustedValue: adjustedMax,
    adjustedValueMin: feeBase.isRange ? adjustedMin : undefined,
    adjustedValueMax: feeBase.isRange ? adjustedMax : undefined,
    comparisonValue: adjustedMin,
    feeSummary: formatFeeRule(match.rule, input.currencies),
    isRange: feeBase.isRange,
  };
}

function estimateFeeInBaseCurrency({
  rule,
  input,
  rawOutput,
  rateValue,
}: {
  rule: RateSourceFeeRule;
  input: FeeAdjustedConversionInput;
  rawOutput: number;
  rateValue: number;
}): { minBase: number; maxBase: number; isRange: boolean } | null {
  const feeCurrencyId = rule.fee_currency_id;
  const baseCurrency = input.rate.SourceCurrencyCode;
  const targetCurrency = input.rate.DestinationCurrencyCode;
  const currencyById = buildCurrencyCodeById(input.currencies);
  const feeCurrency = feeCurrencyId ? currencyById.get(feeCurrencyId) : null;

  const transactionAmount =
    feeCurrency === baseCurrency
      ? input.direction === "buy"
        ? rawOutput
        : input.amount
      : input.direction === "buy"
        ? input.amount
        : rawOutput;

  const bankFee = estimateSingleFee(rule, transactionAmount);
  const swiftFee = estimateSwiftFee(rule);

  const bankFeeBase = convertFeeRangeToBase({
    minFee: bankFee.min,
    maxFee: bankFee.max,
    feeCurrency,
    baseCurrency,
    targetCurrency,
    directRateValue: rateValue,
    input,
  });
  if (!bankFeeBase) return null;

  const swiftCurrency = rule.swift_fee_currency_id ? currencyById.get(rule.swift_fee_currency_id) : null;
  const swiftBase = convertFeeRangeToBase({
    minFee: swiftFee,
    maxFee: swiftFee,
    feeCurrency: swiftCurrency,
    baseCurrency,
    targetCurrency,
    directRateValue: rateValue,
    input,
  });
  if (!swiftBase) return null;

  return {
    minBase: bankFeeBase.minBase + swiftBase.minBase,
    maxBase: bankFeeBase.maxBase + swiftBase.maxBase,
    isRange: bankFee.isRange || bankFeeBase.isRange || swiftBase.isRange,
  };
}

function estimateSingleFee(rule: RateSourceFeeRule, amount: number) {
  const fixed = parseNumber(rule.fixed_fee);
  if (fixed != null) {
    return {
      min: applyVAT(fixed, rule),
      max: applyVAT(fixed, rule),
      isRange: false,
    };
  }

  const exactRate = parseNumber(rule.fee_rate);
  const minRate = parseNumber(rule.fee_rate_min);
  const maxRate = parseNumber(rule.fee_rate_max);
  const minFee = parseNumber(rule.min_fee);
  const maxFee = parseNumber(rule.max_fee);

  const lowRate = exactRate ?? minRate ?? 0;
  const highRate = exactRate ?? maxRate ?? lowRate;
  const low = clampFee(amount * lowRate, minFee, maxFee);
  const high = clampFee(amount * highRate, minFee, maxFee);

  return {
    min: applyVAT(Math.min(low, high), rule),
    max: applyVAT(Math.max(low, high), rule),
    isRange: exactRate == null && minRate != null && maxRate != null && minRate !== maxRate,
  };
}

function estimateSwiftFee(rule: RateSourceFeeRule) {
  if (rule.swift_fee_included) return 0;
  return applyVAT(parseNumber(rule.swift_fee) ?? 0, rule);
}

function convertFeeRangeToBase({
  minFee,
  maxFee,
  feeCurrency,
  baseCurrency,
  targetCurrency,
  directRateValue,
  input,
}: {
  minFee: number;
  maxFee: number;
  feeCurrency: string | null | undefined;
  baseCurrency: string;
  targetCurrency: string;
  directRateValue: number;
  input: FeeAdjustedConversionInput;
}): { minBase: number; maxBase: number; isRange: boolean } | null {
  if (minFee === 0 && maxFee === 0) {
    return { minBase: 0, maxBase: 0, isRange: false };
  }

  if (!feeCurrency) return null;
  if (feeCurrency === baseCurrency) {
    return { minBase: minFee, maxBase: maxFee, isRange: minFee !== maxFee };
  }
  if (feeCurrency === targetCurrency) {
    return {
      minBase: minFee * directRateValue,
      maxBase: maxFee * directRateValue,
      isRange: minFee !== maxFee,
    };
  }

  const crossRate = findForeignToBaseRate(input.allRates, input.rate, feeCurrency);
  if (!crossRate) return null;

  return {
    minBase: minFee * crossRate,
    maxBase: maxFee * crossRate,
    isRange: minFee !== maxFee,
  };
}

function findForeignToBaseRate(allRates: ExchangeRateLatest[], referenceRate: ExchangeRateLatest, feeCurrency: string) {
  const sourceCode = rateSourceKey(referenceRate);
  const sameSourceRates = allRates.filter(
    (rate) => rateSourceKey(rate) === sourceCode && rate.DestinationCurrencyCode === feeCurrency,
  );

  const sellRate = sameSourceRates.find((rate) => SELL_TRANSFER_TYPES.has(rateTypeName(rate)));
  const fallbackRate = sellRate ?? sameSourceRates[0];
  const value = fallbackRate ? Number(fallbackRate.RateValue) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

function applyVAT(amount: number, rule: RateSourceFeeRule) {
  const vatRate = parseNumber(rule.vat_rate) ?? 0;
  if (rule.vat_applies === "true" && !rule.fee_includes_vat) {
    return amount * (1 + vatRate);
  }
  return amount;
}

function clampFee(value: number, minFee: number | null, maxFee: number | null) {
  let next = value;
  if (minFee != null) next = Math.max(next, minFee);
  if (maxFee != null) next = Math.min(next, maxFee);
  return next;
}

function formatRatePart(rule: RateSourceFeeRule) {
  const exact = parseNumber(rule.fee_rate);
  if (exact != null) return `${formatPercent(exact)} fee`;

  const min = parseNumber(rule.fee_rate_min);
  const max = parseNumber(rule.fee_rate_max);
  if (min != null && max != null) return `${formatPercent(min)}-${formatPercent(max)} fee`;
  if (min != null) return `from ${formatPercent(min)} fee`;
  if (max != null) return `up to ${formatPercent(max)} fee`;
  return "";
}

function formatMinMax(minValue: string | null, maxValue: string | null, currency: string) {
  const min = parseNumber(minValue);
  const max = parseNumber(maxValue);
  if (min == null && max == null) return "";
  if (min != null && max != null) return `min ${formatNumber(min)} ${currency}, max ${formatNumber(max)} ${currency}`.trim();
  if (min != null) return `min ${formatNumber(min)} ${currency}`.trim();
  return `max ${formatNumber(max ?? 0)} ${currency}`.trim();
}

function formatPercent(value: number) {
  return `${formatNumber(value * 100, 4)}%`;
}

function formatAmount(value: string | null) {
  const parsed = parseNumber(value);
  return parsed == null ? "" : formatNumber(parsed);
}

function formatNumber(value: number, maximumFractionDigits = 6) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits,
  });
}

function hasNumber(value: string | null) {
  return parseNumber(value) != null;
}

function parseNumber(value: string | null | undefined) {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
