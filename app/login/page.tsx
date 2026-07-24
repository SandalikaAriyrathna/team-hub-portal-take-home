import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  if (await getSession()) {
    redirect("/announcements");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-[#123d31] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[48px] border-[#d9f99d]/10"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9f99d] font-black text-[#123d31]">
            TH
          </span>
          <span className="text-lg font-semibold tracking-tight">Team Hub</span>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-[#d9f99d]">
            One team. One place.
          </p>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
            Keep everyone in the loop.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
            Share important updates, celebrate wins, and make sure the whole
            team knows what matters.
          </p>
        </div>

        <p className="relative text-sm text-white/45">
          Private workspace · Secure access
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#174f3f] font-black text-white">
              TH
            </span>
            <span className="text-lg font-semibold">Team Hub</span>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#174f3f]">
            Welcome back
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">
            Sign in to your workspace
          </h2>
          <p className="mt-4 leading-7 text-[#657269]">
            Enter your administrator credentials to continue.
          </p>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
