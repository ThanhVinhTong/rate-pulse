// Type definition
interface ExchangeRateLatest {
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
  CreatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
}

function nullString(
  v: { String: string; Valid: boolean } | null | undefined,
): string {
  return v?.Valid ? v.String : "—";
}

function nullTime(
  v: { Time: string; Valid: boolean } | null | undefined,
): string {
  return v?.Valid ? new Date(v.Time).toLocaleString() : "—";
}

function roundUp(num: number, precision: number) {
  if (isNaN(num)) {
    return 0.0000;
  }
  if (isNaN(precision)) {
    precision = 4;
  }
  return num.toFixed(precision);
}

export default async function ExchangeRatesPage({}: {}) {
  const base = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";

  // Fetch exchange rates latest
  const VN_MAIN_CURRENCY_ID = 150;
  const VN_LIMIT = 200;
  const exchangeRatesLatestRes = await fetch(
    `${base}/exchange-rates-latest?source_currency_id=${VN_MAIN_CURRENCY_ID}&limit=${VN_LIMIT}`,
    { cache: "no-store" } // or next: { revalidate: 60 } for ISR
  );
  if (!exchangeRatesLatestRes.ok) {
    const errorText = await exchangeRatesLatestRes.text();
    throw new Error(`Failed to fetch exchange rates: ${errorText}`);
  }
  const exchangeRatesLatest: ExchangeRateLatest[] = await exchangeRatesLatestRes.json();
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="hidden md:table-header-group">
          <tr className="text-left text-lg font-bold uppercase tracking-wide">
            <th className="p-2">Pair</th>
            <th className="p-2">Rate</th>
            <th className="p-2">Type</th>
            <th className="p-2">Source</th>
            <th className="p-2">Valid from</th>
            <th className="p-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {exchangeRatesLatest.map((r) => (
            <tr key={r.RateID} className="block border-b border-neutral-200 dark:border-neutral-800 md:table-row md:py-3">
              <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                  Pair:{" "}
                </span>
                {r.SourceCurrencyCode} → {r.DestinationCurrencyCode}
              </td>
              <td className="block w-full p-2 md:table-cell md:w-auto md:p-2 tabular-nums">
                <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                  Rate:{" "}
                </span>
                {roundUp(Number(r.RateValue), 3)}
              </td>
              <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                  Type:{" "}
                </span>
                {nullString(r.TypeName)}
              </td>
              <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                  Source:{" "}
                </span>
                {nullString(r.RateSourceCode)}
              </td>
              <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                  Valid from:{" "}
                </span>
                {new Date(r.ValidFromDate).toLocaleString()}
              </td>
              <td className="block w-full p-2 md:table-cell md:w-auto md:p-2">
                <span className="font-medium text-neutral-500 dark:text-neutral-400 md:hidden">
                  Updated:{" "}
                </span>
                {nullTime(r.UpdatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}