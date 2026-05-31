"use client";

import { useState, useMemo } from "react";

export function useTimezones(initialTimezone?: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState(initialTimezone || "");

  const allTimezones = useMemo(() => {
    try {
      if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
        return Intl.supportedValuesOf("timeZone");
      }
    } catch (e) {
      console.warn("Intl.supportedValuesOf is not supported or failed", e);
    }
    // Minimal fallback timezone list in case the API fails or is not present
    return [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
      "Asia/Singapore",
      "Australia/Sydney",
    ];
  }, []);

  const filteredTimezones = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return allTimezones.slice(0, 8);
    }
    return allTimezones
      .filter((tz) => tz.toLowerCase().includes(query))
      .slice(0, 8);
  }, [allTimezones, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredTimezones,
    allTimezones,
    selectedTimezone,
    setSelectedTimezone,
  };
}
