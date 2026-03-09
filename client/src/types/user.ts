export type SessionRole = "admin" | "trader";

export interface AuthSession {
  email: string;
  name: string;
  role: SessionRole;
}

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
}
