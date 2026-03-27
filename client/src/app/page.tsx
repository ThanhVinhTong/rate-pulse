import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Smartphone } from "lucide-react";
import { CurrencyPair } from "@/types";

// import { exchangeRates, featureCards, landingStats } from "@/lib/mock-data";

export const metadata = {
  title: "Trading Platform",
};

export default function Home() {
  // const highlightPairs = exchangeRates["48h"].slice(0, 3);
  const highlightPairs: CurrencyPair[] = [];

  return (
    <div>
      <h1>Upcoming Features</h1>
    </div>
    // <div className="space-y-6">
    //   <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1322]/90 px-5 py-10 shadow-panel sm:px-8 lg:px-12 lg:py-16">
    //     <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
    //       <div>
    //         <p className="text-sm uppercase tracking-[0.3em] text-accent">
    //           Mobile-first trading experience
    //         </p>
    //         <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
    //           Professional fintech dashboards for modern traders.
    //         </h1>
    //         <p className="mt-5 max-w-2xl text-base leading-7 text-text-muted sm:text-lg">
    //           Rate-pulse brings together exchange rates, portfolio analytics, account
    //           controls, and admin visibility in one responsive trading platform.
    //         </p>

    //         <div className="mt-8 flex flex-col gap-3 sm:flex-row">
    //           <Link
    //             href="/signup"
    //             className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#1b78ff]"
    //           >
    //             Start trading
    //             <ArrowRight className="h-4 w-4" />
    //           </Link>
    //           <Link
    //             href="/analytics"
    //             className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-text-primary transition hover:border-accent hover:text-white"
    //           >
    //             Explore analytics
    //           </Link>
    //         </div>

    //         <div className="mt-8 grid gap-3 sm:grid-cols-3">
    //           {landingStats.map((stat) => (
    //             <div
    //               key={stat.label}
    //               className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
    //             >
    //               <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">
    //                 {stat.label}
    //               </p>
    //               <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
    //             </div>
    //           ))}
    //         </div>
    //       </div>

    //       <div className="grid gap-4 sm:grid-cols-2">
    //         <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-transparent p-5">
    //           <BarChart3 className="h-8 w-8 text-accent" />
    //           <h2 className="mt-5 text-xl font-semibold text-white">Analytics at a glance</h2>
    //           <p className="mt-3 text-sm leading-6 text-text-muted">
    //             Interactive charts surface performance, volume, and market trends
    //             with clear visual hierarchy.
    //           </p>
    //         </div>
    //         <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-accent/20 to-transparent p-5">
    //           <Smartphone className="h-8 w-8 text-primary" />
    //           <h2 className="mt-5 text-xl font-semibold text-white">Built for every screen</h2>
    //           <p className="mt-3 text-sm leading-6 text-text-muted">
    //             Touch-friendly controls, adaptive layouts, and fast navigation
    //             keep the mobile experience smooth.
    //           </p>
    //         </div>
    //         <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-5 sm:col-span-2">
    //           <ShieldCheck className="h-8 w-8 text-status-success" />
    //           <h2 className="mt-5 text-xl font-semibold text-white">Protected workspaces</h2>
    //           <p className="mt-3 text-sm leading-6 text-text-muted">
    //             Middleware-backed guards and role-based access keep profile and
    //             admin routes separated for safer operations.
    //           </p>
    //         </div>
    //       </div>
    //     </div>
    //   </section>

    //   <section className="grid gap-4 lg:grid-cols-3">
    //     {featureCards.map((feature) => (
    //       <article
    //         key={feature.title}
    //         className="rounded-2xl border border-white/10 bg-white/5 p-6"
    //       >
    //         <p className="text-sm uppercase tracking-[0.2em] text-accent">{feature.title}</p>
    //         <p className="mt-4 text-sm leading-7 text-text-muted">{feature.description}</p>
    //       </article>
    //     ))}
    //   </section>

    //   <section className="rounded-2xl border border-white/10 bg-[#0d1322] p-6">
    //     <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    //       <div>
    //         <p className="text-sm uppercase tracking-[0.24em] text-accent">Exchange highlights</p>
    //         <h2 className="mt-3 text-2xl font-semibold text-white">Major pairs on today&apos;s radar</h2>
    //       </div>
    //       <Link
    //         href="/exchange-rates"
    //         className="text-sm font-medium text-primary transition hover:text-accent"
    //       >
    //         View full dashboard
    //       </Link>
    //     </div>

    //     <div className="mt-6 grid gap-4 md:grid-cols-3">
    //       {highlightPairs.map((pair) => (
    //         <article
    //           key={pair.pair}
    //           className="rounded-2xl border border-white/10 bg-white/5 p-5"
    //         >
    //           <div className="flex items-center justify-between gap-3">
    //             <div>
    //               <h3 className="text-xl font-semibold text-white">{pair.pair}</h3>
    //               <p className="mt-1 text-sm text-text-muted">
    //                 {pair.base} / {pair.quote}
    //               </p>
    //             </div>
    //             <p
    //               className={`text-sm font-medium ${
    //                 pair.change >= 0 ? "text-status-success" : "text-status-danger"
    //               }`}
    //             >
    //               {pair.change >= 0 ? "+" : ""}
    //               {pair.change}%
    //             </p>
    //           </div>
    //           <p className="mt-6 text-3xl font-semibold text-white">{pair.rate}</p>
    //           <p className="mt-2 text-sm text-text-muted">Volume {pair.volume}</p>
    //         </article>
    //       ))}
    //     </div>
    //   </section>
    // </div>
  );
}
