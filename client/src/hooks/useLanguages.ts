"use client";

import { useState, useMemo } from "react";

export interface LanguageItem {
  code: string;
  name: string;
  displayName: string;
}

// Complete list of ISO 639-1 standard language codes
const ISO_LANGUAGES = [
  "af", "am", "ar", "as", "az", "be", "bg", "bn", "bs", "ca", "cs", "cy", "da", "de", "el", "en", "eo", 
  "es", "et", "eu", "fa", "fi", "fil", "fr", "fy", "ga", "gd", "gl", "gu", "ha", "he", "hi", "hr", "hu", 
  "hy", "id", "ig", "is", "it", "ja", "jv", "ka", "kk", "km", "kn", "ko", "ku", "ky", "la", "lb", "lo", 
  "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", 
  "pl", "ps", "pt", "ro", "ru", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", 
  "sv", "sw", "ta", "te", "tg", "th", "tk", "tr", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", 
  "zh", "zu"
];

export function useLanguages(initialLanguage?: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || "");

  const allLanguages = useMemo<LanguageItem[]>(() => {
    let displayNames: Intl.DisplayNames | null = null;
    try {
      if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
        displayNames = new Intl.DisplayNames(["en"], { type: "language" });
      }
    } catch (e) {
      console.warn("Intl.DisplayNames is not supported or failed", e);
    }

    return ISO_LANGUAGES.map((code) => {
      let name = code;
      if (displayNames) {
        try {
          name = displayNames.of(code) || code;
        } catch (e) {
          // Fallback to code if resolution fails
        }
      }
      return {
        code,
        name,
        displayName: `${name} (${code})`,
      };
    });
  }, []);

  const filteredLanguages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return allLanguages.slice(0, 8);
    }
    return allLanguages
      .filter(
        (lang) =>
          lang.code.toLowerCase().includes(query) ||
          lang.name.toLowerCase().includes(query) ||
          lang.displayName.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [allLanguages, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredLanguages,
    allLanguages,
    selectedLanguage,
    setSelectedLanguage,
  };
}
