// Type definition (add this at the top of the file or in a separate types file)
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

interface Currencies {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  CurrencySymbol: string | null;
  CreatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
}

interface Countries {
  CountryID: number;
  CountryName: string;
  CurrencyID: number;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  CreatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  CountryCode: string | null;
}

interface RateSource {
  SourceID: number;
  SourceCode: string;
  SourceName: string;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  CreatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
}

export default async function ExchangeRatesPage({}: {}) {
  const base = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";

  // Fetch currencies
  const currenciesRes = await fetch(`${base}/currencies`, { cache: "no-store" });
  if (!currenciesRes.ok) {
    const errorText = await currenciesRes.text();
    throw new Error(`Failed to fetch currencies: ${errorText}`);
  }
  const currencies: Currencies[] = await currenciesRes.json();

  // Fetch countries
  const countriesRes = await fetch(`${base}/countries`, { cache: "no-store" });
  if (!countriesRes.ok) {
    const errorText = await countriesRes.text();
    throw new Error(`Failed to fetch countries: ${errorText}`);
  }
  const countries: Countries[] = await countriesRes.json();

  // Fetch rate sources
  const rateSourcesRes = await fetch(`${base}/rate-sources`, { cache: "no-store" });
  if (!rateSourcesRes.ok) {
    const errorText = await rateSourcesRes.text();
    throw new Error(`Failed to fetch rate sources: ${errorText}`);
  }
  const rateSources: RateSource[] = await rateSourcesRes.json();

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

  // === DATA PROCESSING FOR NICE TABLE ===
  const currencyMap = new Map(currencies.map((c) => [c.CurrencyCode, c]));

  // Sort by destination currency → then by type (Buy/Sell order looks natural)
  const sortedRates = [...exchangeRatesLatest].sort((a, b) => {
    const codeCompare = a.DestinationCurrencyCode.localeCompare(b.DestinationCurrencyCode);
    if (codeCompare !== 0) return codeCompare;
    return (a.TypeName?.String || "").localeCompare(b.TypeName?.String || "");
  });
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">VND Exchange Rates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Live rates from banks • Updated just now
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-sm font-medium">
            • Live
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                DESTINATION
              </th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                SOURCE
              </th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                TYPE
              </th>
              <th className="px-6 py-5 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">
                RATE
              </th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                VALID FROM
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {sortedRates.map((rate) => {
              const dest = currencyMap.get(rate.DestinationCurrencyCode);
              const rateNum = parseFloat(rate.RateValue);

              return (
                <tr
                  key={rate.RateID}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Destination */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-x-3">
                      <span className="text-2xl">🇻🇳</span>
                      <div>
                        <div className="font-semibold text-lg">
                          {rate.DestinationCurrencyCode}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {dest?.CurrencyName || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm font-medium">
                      {rate.RateSourceCode?.String || "—"}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span
                      className={`inline-flex px-4 py-1 text-sm font-medium rounded-2xl ${
                        rate.TypeName?.String?.toLowerCase().includes("buy")
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      }`}
                    >
                      {rate.TypeName?.String || "—"}
                    </span>
                  </td>

                  {/* Rate Value */}
                  <td className="px-6 py-5 text-right font-mono text-2xl font-semibold tabular-nums">
                    {rateNum.toLocaleString("en-US")}
                  </td>

                  {/* Valid From */}
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(rate.ValidFromDate).toLocaleString("en-AU", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
        <p>
          Showing <span className="font-medium text-gray-600 dark:text-gray-300">{sortedRates.length}</span>{" "}
          rates • Base: <span className="font-semibold">VND</span>
        </p>
        <p className="text-right">
          Data fetched at{" "}
          <span className="font-mono">{new Date().toLocaleTimeString("en-AU")}</span>
        </p>
      </div>
    </div>
  );
}