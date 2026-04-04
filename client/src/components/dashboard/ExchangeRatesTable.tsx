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

export default async function ExchangeRatesTable({}: {}) {
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
        <thead>
          <tr className="border-b">
            <th className="p-2 text-center text-xs font-medium uppercase tracking-wide">ID</th>
            <th className="p-2 text-center text-xs font-medium uppercase tracking-wide">Pair</th>
            <th className="p-2 text-center text-xs font-medium uppercase tracking-wide">Rate</th>
            <th className="p-2 text-center text-xs font-medium uppercase tracking-wide">Type</th>
            <th className="p-2 text-center text-xs font-medium uppercase tracking-wide">Source</th>
            <th className="p-2 text-center text-xs font-medium uppercase tracking-wide">Valid from</th>
            <th className="p-2 text-center text-xs font-medium uppercase tracking-wide">Updated</th>
          </tr>
        </thead>
        <tbody>
          {exchangeRatesLatest.map((r) => (
            <tr key={r.RateID} className="border-b border-neutral-200 dark:border-neutral-800">
              <td className="p-2">{r.RateID}</td>
              <td className="p-2">
                {r.SourceCurrencyCode} → {r.DestinationCurrencyCode}
              </td>
              <td className="p-2 text-right tabular-nums">{roundUp(Number(r.RateValue), 4)}</td>
              <td className="p-2">{nullString(r.TypeName)}</td>
              <td className="p-2">{nullString(r.RateSourceCode)}</td>
              <td className="p-2">{new Date(r.ValidFromDate).toLocaleString()}</td>
              <td className="p-2">{nullTime(r.UpdatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}