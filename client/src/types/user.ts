export type SessionRole = "free" | "premium" | "enterprise" | "admin";

export interface AuthSession {
  userId?: number;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  timeZone?: string;
  countryOfResidence?: string;
  countryOfBirth?: string;
  role: SessionRole;
  sessionId?: string;
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
}

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
}
