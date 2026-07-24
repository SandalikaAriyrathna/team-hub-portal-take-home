import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export default async function AnnouncementsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-lg rounded-3xl border border-[#dfe5dc] bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#174f3f]">
          Signed in
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Welcome, {session.name}
        </h1>
        <p className="mt-4 leading-7 text-[#657269]">
          Authentication is working. The announcements workspace will be added
          in the next section.
        </p>
      </div>
    </main>
  );
}
