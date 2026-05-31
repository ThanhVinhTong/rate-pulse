"use client";

import { useState, useEffect } from "react";
import type { Profile } from "@/types";

const PROFILE_KEY = "rate_pulse_profile";

export interface ProfileContextState {
  profile: Profile | null;
  updateProfile: (newProfile: Profile) => void;
  clearProfile: () => void;
}

export function useProfile(initialProfile?: Profile | null): ProfileContextState {
  const [profile, setProfileState] = useState<Profile | null>(initialProfile || null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(PROFILE_KEY);
      if (cached) {
        setProfileState(JSON.parse(cached));
      } else if (initialProfile) {
        setProfileState(initialProfile);
      }
    } catch (e) {
      console.error("Failed to load profile from localStorage", e);
    }
  }, [initialProfile]);

  const updateProfile = (newProfile: Profile) => {
    setProfileState(newProfile);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      console.error("Failed to save profile to localStorage", e);
    }
  };

  const clearProfile = () => {
    setProfileState(null);
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (e) {
      console.error("Failed to clear profile from localStorage", e);
    }
  };

  return {
    profile,
    updateProfile,
    clearProfile,
  };
}
