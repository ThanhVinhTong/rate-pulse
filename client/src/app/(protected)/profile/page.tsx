import type { Metadata } from "next";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile",
  description: "Protected trader profile with personal preferences and account controls.",
};

export default async function ProfilePage() {
  const session = await requireAuth();

  return <ProfileTabs session={session} />;
}
