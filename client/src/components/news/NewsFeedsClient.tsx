"use client";

import { useState, useEffect } from "react";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { NewsArticleCard } from "@/components/dashboard/NewsArticleCard";
import type { NewsArticle, NewsFeedsClientProps } from "@/types";
import { REGION_TABS, SECTOR_TABS } from "@/types";

type TabId = string;

export function NewsFeedsClient({ feeds }: NewsFeedsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("world_news");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    // lg breakpoint in tailwind is 1024px
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    
    const handleResize = () => {
      // 5 items for mobile/tablet, 9 for desktop (which fits cleanly into 3 columns)
      setItemsPerPage(mediaQuery.matches ? 5 : 9);
    };
    
    handleResize();
    
    // Add event listener (fallback support for older browsers included)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleResize);
      return () => mediaQuery.removeEventListener("change", handleResize);
    } else {
      mediaQuery.addListener(handleResize);
      return () => mediaQuery.removeListener(handleResize);
    }
  }, []);

  // Format category text nicely (e.g., "world_news" -> "World News")
  const formatCategory = (key: string) => {
    return key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const currentFeed = feeds[activeTab] || [];
  const totalPages = Math.ceil(currentFeed.length / itemsPerPage);
  
  const paginatedFeed = currentFeed.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Regions
        </div>
        <UnderlineTabs
          items={REGION_TABS}
          value={activeTab}
          onChange={setActiveTab}
          className="border-none"
        />
        <div className="mt-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Sectors & Intelligence
        </div>
        <UnderlineTabs
          items={SECTOR_TABS}
          value={activeTab}
          onChange={setActiveTab}
          className="border-none"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {paginatedFeed.length > 0 ? (
          paginatedFeed.map((doc, i) => {
            // Map FeedArticleDoc to NewsArticle so we can use NewsArticleCard
            const article: NewsArticle = {
              title: doc.title,
              href: doc.href,
              domain: doc.domain,
              source: doc.source,
              category: formatCategory(activeTab) as any, // Cast to any to bypass strict type for dynamic keys
              timestamp: doc.time || null,
            };

            return <NewsArticleCard key={`${doc.href}-${i}`} article={article} />;
          })
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted">
            No articles found for this category.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-primary/50 hover:bg-surface-elevated disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-panel"
          >
            Previous
          </button>
          
          <div className="text-sm font-medium text-text-muted">
            Page <span className="text-text-primary">{currentPage}</span> of <span className="text-text-primary">{totalPages}</span>
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-primary/50 hover:bg-surface-elevated disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-panel"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
