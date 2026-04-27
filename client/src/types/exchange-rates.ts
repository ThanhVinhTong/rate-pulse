export const EXCHANGE_RATES_LIMIT = 1000;
export const DEFAULT_SOURCE_CURRENCY_ID = 150; // VND
export const DEFAULT_TARGET_CURRENCY_CODE = "AUD"; // AUD

export interface ExchangeRateLatest {
    RateID: number;
    RateValue: string;
    SourceCurrencyCode: string;
    DestinationCurrencyCode: string;
    ValidFromDate: string;
    RateSourceCode: {
      String: string;
      Valid: boolean;
    } | null;
    TypeName: {
      String: string;
      Valid: boolean;
    } | null;
    UpdatedAt: {
      Time: string;
      Valid: boolean;
    } | null;
}

export interface Currency {
    CurrencyID: number;
    CurrencyCode: string;
    CurrencyName: string;
}

export interface RateSourceMetadata {
    SourceID: number;
    SourceName: string;
    SourceCode: string | { String: string; Valid: boolean } | null;
    SourceLink: string | { String: string; Valid: boolean } | null;
}