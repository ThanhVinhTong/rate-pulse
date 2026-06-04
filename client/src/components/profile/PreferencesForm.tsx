"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CurrencySelect } from "@/components/profile/ProfileSelectors";
import { DEFAULT_SOURCE_CURRENCY_ID, type Currency, type RateSourceMetadata } from "@/types/exchange-rates";

interface PreferencesFormProps {
  currencies: Currency[];
  favoriteCurrencyCode: string;
  preferredCurrencyIds: number[];
  rateSources: RateSourceMetadata[];
  preferredSourceIds: number[];
}

export function PreferencesForm({
  currencies,
  favoriteCurrencyCode,
  preferredCurrencyIds,
  rateSources,
  preferredSourceIds,
}: PreferencesFormProps) {
  const [primaryCurrency, setPrimaryCurrency] = useState(favoriteCurrencyCode);
  const [preferredIds, setPreferredIds] = useState<number[]>(preferredCurrencyIds);
  const [searchQuery, setSearchQuery] = useState("");

  const [preferredSIds, setPreferredSIds] = useState<number[]>(preferredSourceIds);
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");

  useEffect(() => {
    setPrimaryCurrency(favoriteCurrencyCode);
  }, [favoriteCurrencyCode]);

  useEffect(() => {
    setPreferredIds(preferredCurrencyIds);
  }, [preferredCurrencyIds]);

  useEffect(() => {
    setPreferredSIds(preferredSourceIds);
  }, [preferredSourceIds]);

  // Helper to extract SourceCode string safely
  const getSourceCode = (rs: RateSourceMetadata): string => {
    if (!rs.SourceCode) return "";
    if (typeof rs.SourceCode === "string") return rs.SourceCode;
    if (typeof rs.SourceCode === "object" && rs.SourceCode.Valid) return rs.SourceCode.String;
    return "";
  };

  // Resolve ID list to Currency objects
  const preferredCurrencyObjects = useMemo(() => {
    return preferredIds
      .map((id) => currencies.find((c) => c.CurrencyID === id))
      .filter((c): c is Currency => !!c);
  }, [preferredIds, currencies]);

  // Resolve ID list to Rate Source objects
  const preferredSourceObjects = useMemo(() => {
    return preferredSIds
      .map((id) => rateSources.find((rs) => rs.SourceID === id))
      .filter((rs): rs is RateSourceMetadata => !!rs);
  }, [preferredSIds, rateSources]);

  // Filter out currencies matching the query and not already preferred
  const filteredSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return currencies
      .filter(
        (c) =>
          !preferredIds.includes(c.CurrencyID) &&
          (c.CurrencyCode.toLowerCase().includes(query) ||
            c.CurrencyName.toLowerCase().includes(query))
      )
      .slice(0, 8); // limit results for speed
  }, [searchQuery, currencies, preferredIds]);

  // Filter out rate sources matching the query and not already preferred
  const filteredSourceSearchResults = useMemo(() => {
    const query = sourceSearchQuery.trim().toLowerCase();
    if (!query) return [];

    const uniqueSources: RateSourceMetadata[] = [];
    const seenIds = new Set<number>();

    for (const rs of rateSources) {
      if (seenIds.has(rs.SourceID) || preferredSIds.includes(rs.SourceID)) {
        continue;
      }

      const codeStr = getSourceCode(rs).toLowerCase();
      const nameStr = rs.SourceName.toLowerCase();

      if (codeStr.includes(query) || nameStr.includes(query)) {
        seenIds.add(rs.SourceID);
        uniqueSources.push(rs);
      }
    }

    return uniqueSources.slice(0, 8);
  }, [sourceSearchQuery, rateSources, preferredSIds]);

  // Add currency action
  const handleAddCurrency = async (currencyId: number) => {
    // Optimistic UI update
    setPreferredIds((prev) => [...prev, currencyId]);
    setSearchQuery("");

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currencyId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add preferred currency");
      }

      toast.success("Preferred currency added successfully");
      
      // Invalidate the sessionStorage cache so the converter & exchange-rates pages pick up the new preference!
      sessionStorage.removeItem("rp_preferred_currency_ids");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to add preferred currency");
      // Revert optimistic update
      setPreferredIds((prev) => prev.filter((id) => id !== currencyId));
    }
  };

  // Remove currency action
  const handleRemoveCurrency = async (currencyId: number) => {
    // Optimistic UI update
    setPreferredIds((prev) => prev.filter((id) => id !== currencyId));

    try {
      const res = await fetch(`/api/preferences?currencyId=${currencyId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove preferred currency");
      }

      toast.success("Preferred currency removed successfully");

      // Invalidate the sessionStorage cache
      sessionStorage.removeItem("rp_preferred_currency_ids");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to remove preferred currency");
      // Revert optimistic update
      setPreferredIds((prev) => [...prev, currencyId]);
    }
  };

  // Add rate source action
  const handleAddSource = async (sourceId: number) => {
    // Optimistic UI update
    setPreferredSIds((prev) => [...prev, sourceId]);
    setSourceSearchQuery("");

    try {
      const res = await fetch("/api/preferences/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add preferred rate source");
      }

      toast.success("Preferred rate source added successfully");
      sessionStorage.removeItem("rp_preferred_source_ids");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to add preferred rate source");
      // Revert optimistic update
      setPreferredSIds((prev) => prev.filter((id) => id !== sourceId));
    }
  };

  // Remove rate source action
  const handleRemoveSource = async (sourceId: number) => {
    // Optimistic UI update
    setPreferredSIds((prev) => prev.filter((id) => id !== sourceId));

    try {
      const res = await fetch(`/api/preferences/sources?sourceId=${sourceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove preferred rate source");
      }

      toast.success("Preferred rate source removed successfully");
      sessionStorage.removeItem("rp_preferred_source_ids");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to remove preferred rate source");
      // Revert optimistic update
      setPreferredSIds((prev) => [...prev, sourceId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find currency ID for the selected primaryCurrency code
    const selected = currencies.find((c) => c.CurrencyCode === primaryCurrency);
    const currencyId = selected ? selected.CurrencyID : null;

    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currencyId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save primary currency preference");
      }

      toast.success("Preferences saved successfully");

      // Update preferredIds state so it immediately shows up in the preferred list
      if (currencyId && !preferredIds.includes(currencyId)) {
        setPreferredIds((prev) => [...prev, currencyId]);
        sessionStorage.removeItem("rp_preferred_currency_ids");
      }

      // Synchronize the favorite currency cookie on the client side instantly
      const cookieVal = currencyId ? String(currencyId) : String(DEFAULT_SOURCE_CURRENCY_ID);
      document.cookie = `rp_favorite_currency_id=${cookieVal}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save primary currency preference");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div>
            <h2 className="mb-6 text-xl font-semibold text-text-primary">Currency Preferences</h2>
            
            <div className="space-y-6">
            <label className="block space-y-2">
                <span className="text-sm font-medium text-text-muted">Primary Currency</span>
                <CurrencySelect
                    name="primaryCurrency"
                    defaultValue={primaryCurrency}
                    onChange={setPrimaryCurrency}
                    currencies={currencies}
                />
            </label>

            <div className="space-y-3">
                <span className="block text-sm font-medium text-text-muted">Preferred Currencies</span>
                
                {/* Search Input */}
                <div className="relative w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search currency to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchQuery.trim().length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg">
                      {filteredSearchResults.map((c) => (
                        <button
                          key={c.CurrencyID}
                          type="button"
                          onClick={() => handleAddCurrency(c.CurrencyID)}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-text-primary hover:bg-panel transition-colors"
                        >
                          <span>
                            <span className="font-semibold">{c.CurrencyCode}</span> - {c.CurrencyName}
                          </span>
                          <Plus className="h-3.5 w-3.5 text-primary" />
                        </button>
                      ))}
                      {filteredSearchResults.length === 0 && (
                        <div className="px-3 py-2 text-center text-xs text-text-muted">
                          No currencies found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preference Pills List */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {preferredCurrencyObjects.map((c) => (
                    <div
                      key={c.CurrencyID}
                      className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-text-primary transition-all hover:border-primary/30"
                    >
                      <span className="font-semibold">{c.CurrencyCode}</span>
                      <span className="text-text-muted">|</span>
                      <span>{c.CurrencyName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCurrency(c.CurrencyID)}
                        className="ml-1 rounded-full p-0.5 text-text-muted hover:bg-border hover:text-status-danger transition-colors"
                        title={`Remove ${c.CurrencyCode}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {preferredCurrencyObjects.length === 0 && (
                    <div className="text-xs text-text-muted italic py-1">
                      No preferred currencies added yet. Search above to add.
                    </div>
                  )}
                </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
                <span className="block text-sm font-medium text-text-muted">Preferred Rate Sources</span>
                
                {/* Search Input for Sources */}
                <div className="relative w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search bank / source to add..."
                      value={sourceSearchQuery}
                      onChange={(e) => setSourceSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {sourceSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSourceSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown for Sources */}
                  {sourceSearchQuery.trim().length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg">
                      {filteredSourceSearchResults.map((rs) => {
                        const code = getSourceCode(rs);
                        return (
                          <button
                            key={rs.SourceID}
                            type="button"
                            onClick={() => handleAddSource(rs.SourceID)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-text-primary hover:bg-panel transition-colors"
                          >
                            <span>
                              <span className="font-semibold">{code || rs.SourceName}</span>
                              {code && ` - ${rs.SourceName}`}
                            </span>
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </button>
                        );
                      })}
                      {filteredSourceSearchResults.length === 0 && (
                        <div className="px-3 py-2 text-center text-xs text-text-muted">
                          No rate sources found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preferred Source Pills List */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {preferredSourceObjects.map((rs) => {
                    const code = getSourceCode(rs);
                    return (
                      <div
                        key={rs.SourceID}
                        className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-text-primary transition-all hover:border-primary/30"
                      >
                        <span className="font-semibold">{code || rs.SourceName}</span>
                        {code && (
                          <>
                            <span className="text-text-muted">|</span>
                            <span>{rs.SourceName}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSource(rs.SourceID)}
                          className="ml-1 rounded-full p-0.5 text-text-muted hover:bg-border hover:text-status-danger transition-colors"
                          title={`Remove ${code || rs.SourceName}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  {preferredSourceObjects.length === 0 && (
                    <div className="text-xs text-text-muted italic py-1">
                      No preferred rate sources added yet. Search above to add.
                    </div>
                  )}
                </div>
            </div>
            </div>
        </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
