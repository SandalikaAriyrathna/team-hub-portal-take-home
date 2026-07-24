import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AnnouncementsPortal } from "@/components/AnnouncementsPortal";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Announcements",
};

export default async function AnnouncementsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <AnnouncementsPortal user={session} />;
}
