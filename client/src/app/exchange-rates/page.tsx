
export default async function ExchangeRatesPage({}: {}) {
  const base = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";
  const res = await fetch(
    `${base}/exchange-rates-latest?source_currency_id=150&limit=200`,
    { cache: "no-store" }, // or next: { revalidate: 60 }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return <div>{JSON.stringify(data)}</div>;
}
