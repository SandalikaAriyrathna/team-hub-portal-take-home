"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }

      router.replace("/announcements");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">
          Email address
        </label>
        <input
          className="focus-ring h-12 w-full rounded-xl border border-[#d6ded5] bg-white px-4 outline-none transition focus:border-[#174f3f]"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@teamhub.local"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          className="focus-ring h-12 w-full rounded-xl border border-[#d6ded5] bg-white px-4 outline-none transition focus:border-[#174f3f]"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          minLength={8}
          required
        />
      </div>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        className="focus-ring h-12 w-full rounded-xl bg-[#174f3f] px-5 font-semibold text-white transition hover:bg-[#0d382c] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
