export type SessionRole = "free" | "premium" | "enterprise" | "admin";

export interface AuthSession {
  userID: number;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: SessionRole;
  sessionId?: string;
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  profile?: Profile;
}

export interface Profile {
  timeZone?: string;
  languagePref?: string;
  countryOfResidence?: string;
  countryOfBirth?: string;
}

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
}
