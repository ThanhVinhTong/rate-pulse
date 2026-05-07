import { cn } from "@/lib/utils";

const CURRENCY_FLAG_FILES: Record<string, string> = {
  AED: "united-arab-emirates.svg",
  AFN: "afghanistan.svg",
  ALL: "albania.svg",
  AMD: "armenia.svg",
  ANG: "netherlands-antilles.svg",
  AOA: "angola.svg",
  ARS: "argentina.svg",
  AUD: "australia.svg",
  AWG: "aruba.svg",
  AZN: "azerbaijan.svg",
  BAM: "bosnia-herzegovina.svg",
  BBD: "barbados.svg",
  BDT: "bangladesh.svg",
  BGN: "bulgaria.svg",
  BHD: "bahrain.svg",
  BIF: "burundi.svg",
  BMD: "bermuda.svg",
  BND: "brunei.svg",
  BOB: "bolivia.svg",
  BRL: "brazil.svg",
  BSD: "bahamas.svg",
  BTN: "bhutan.svg",
  BWP: "botswana.svg",
  BYN: "belarus.svg",
  BZD: "belize.svg",
  CAD: "canada.svg",
  CDF: "democratic-republic-congo.svg",
  CHF: "switzerland.svg",
  CLP: "chile.svg",
  CNY: "china.svg",
  COP: "colombia.svg",
  CRC: "costa-rica.svg",
  CUP: "cuba.svg",
  CVE: "cape-verde.svg",
  CZK: "czechia.svg",
  DJF: "djibouti.svg",
  DKK: "denmark.svg",
  DOP: "dominican-republic.svg",
  DZD: "algeria.svg",
  EGP: "egypt.svg",
  ERN: "eritrea.svg",
  ETB: "ethiopia.svg",
  EUR: "europe.svg",
  FJD: "fiji.svg",
  FKP: "falkland-islands.svg",
  GBP: "united-kingdom-uk.svg",
  GEL: "georgia.svg",
  GHS: "ghana.svg",
  GIP: "gibraltar.svg",
  GMD: "gambia.svg",
  GNF: "guinea.svg",
  GTQ: "guatemala.svg",
  GYD: "guyana.svg",
  HKD: "hong-kong.svg",
  HNL: "honduras.svg",
  HRK: "croatia.svg",
  HTG: "haiti.svg",
  HUF: "hungary.svg",
  IDR: "indonesia.svg",
  ILS: "israel.svg",
  INR: "india.svg",
  IQD: "iraq.svg",
  IRR: "iran.svg",
  ISK: "iceland.svg",
  JMD: "jamaica.svg",
  JOD: "jordan.svg",
  JPY: "japan.svg",
  KES: "kenya.svg",
  KGS: "kyrgyzstan.svg",
  KHR: "cambodia.svg",
  KMF: "comoros.svg",
  KPW: "north-korea.svg",
  KRW: "south-korea.svg",
  KWD: "kuwait.svg",
  KYD: "cayman-islands.svg",
  KZT: "kazakhstan.svg",
  LAK: "laos.svg",
  LBP: "lebanon.svg",
  LKR: "sri-lanka.svg",
  LRD: "liberia.svg",
  LSL: "lesotho.svg",
  LYD: "libya.svg",
  MAD: "morocco.svg",
  MDL: "moldova.svg",
  MGA: "madagascar.svg",
  MKD: "north-macedonia.svg",
  MMK: "myanmar.svg",
  MNT: "mongolia.svg",
  MOP: "macau.svg",
  MRU: "mauritania.svg",
  MUR: "mauritius.svg",
  MVR: "maldives.svg",
  MWK: "malawi.svg",
  MXN: "mexico.svg",
  MYR: "malaysia.svg",
  MZN: "mozanbique.svg",
  NAD: "namibia.svg",
  NGN: "nigeria.svg",
  NIO: "nicaragua.svg",
  NOK: "norway.svg",
  NPR: "nepal.svg",
  NZD: "new-zealand.svg",
  OMR: "oman.svg",
  PAB: "panama.svg",
  PEN: "peru.svg",
  PGK: "papua-new-guinea.svg",
  PHP: "philippines.svg",
  PKR: "pakistan.svg",
  PLN: "poland.svg",
  PYG: "paraguay.svg",
  QAR: "qatar.svg",
  RON: "romania.svg",
  RSD: "serbia.svg",
  RUB: "russia.svg",
  RWF: "rwanda.svg",
  SAR: "saudi-arabia.svg",
  SBD: "solomon-islands.svg",
  SCR: "seychelles.svg",
  SDG: "sudan.svg",
  SEK: "sweden.svg",
  SGD: "singapore.svg",
  SLE: "sierra-leone.svg",
  SOS: "somalia.svg",
  SRD: "suriname.svg",
  SSP: "south-sudan.svg",
  STN: "sao-tome-principe.svg",
  SYP: "syria.svg",
  SZL: "eswatini.svg",
  THB: "thailand.svg",
  TJS: "tajikistan.svg",
  TMT: "turkmenistan.svg",
  TND: "tunisia.svg",
  TOP: "tonga.svg",
  TRY: "turkey.svg",
  TTD: "trinidad-tobago.svg",
  TWD: "taiwan.svg",
  TZS: "tanzania.svg",
  UAH: "ukraine.svg",
  UGX: "uganda.svg",
  USD: "united-states-usa.svg",
  UYU: "uruguay.svg",
  UZS: "uzbekistan.svg",
  VES: "venezuela.svg",
  VND: "vietnam.svg",
  VUV: "vanuatu.svg",
  WST: "samoa.svg",
  XAF: "republic-congo.svg",
  XCD: "saint-kitts-nevis.svg",
  XOF: "senegal.svg",
  XPF: "french-polynesia.svg",
  YER: "yemen.svg",
  ZAR: "south-africa.svg",
  ZMW: "zambia.svg",
  ZWL: "zimbabwe.svg",
};

type CurrencyFlagProps = {
  code: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
  shape?: "circle" | "rounded";
};

const sizeClass = {
  sm: "size-4",
  md: "size-5",
};

export function getCurrencyFlagPath(code: string | null | undefined) {
  if (!code) return null;
  const file = CURRENCY_FLAG_FILES[code.trim().toUpperCase()];
  return file ? `/country_flags/${file}` : null;
}

export function CurrencyFlag({
  code,
  className,
  size = "sm",
  shape = "circle",
}: CurrencyFlagProps) {
  const flagPath = getCurrencyFlagPath(code);

  if (!flagPath) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden border border-border/70 bg-panel shadow-sm",
        sizeClass[size],
        shape === "circle" ? "rounded-full" : "rounded-sm",
        className,
      )}
    >
      <img
        src={flagPath}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="h-full w-full object-cover saturate-[.82] contrast-[.96]"
      />
    </span>
  );
}

export function CurrencyCodeBadge({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap font-semibold tabular-nums text-text-primary",
        className,
      )}
    >
      <CurrencyFlag code={code} />
      <span>{code}</span>
    </span>
  );
}

export function CurrencyPairBadge({
  sourceCode,
  destinationCode,
  separator = "↔",
  className,
}: {
  sourceCode: string;
  destinationCode: string;
  separator?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-text-primary",
        className,
      )}
    >
      <CurrencyCodeBadge code={sourceCode} />
      <span className="text-text-tertiary">{separator}</span>
      <CurrencyCodeBadge code={destinationCode} />
    </span>
  );
}

export function CurrencyOptionPreview({
  code,
  name,
  className,
}: {
  code: string;
  name?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mt-2 inline-flex max-w-full items-center gap-2 rounded-md border border-border/70 bg-panel/60 px-2.5 py-1 text-xs text-text-muted",
        className,
      )}
    >
      <CurrencyCodeBadge code={code} className="text-xs" />
      {name ? <span className="truncate">{name}</span> : null}
    </span>
  );
}
