"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Session } from "@/lib/session";

type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

type AnnouncementsResponse = {
  announcements?: Announcement[];
  announcement?: Announcement;
  error?: string;
};

class AuthenticationRequiredError extends Error {}

async function fetchAnnouncements() {
  const response = await fetch("/api/announcements");

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  const data = (await response.json()) as AnnouncementsResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load announcements.");
  }

  return data.announcements ?? [];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AnnouncementsPortal({ user }: { user: Session }) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const loadedAnnouncements = await fetchAnnouncements();

        if (active) {
          setAnnouncements(loadedAnnouncements);
        }
      } catch (caught) {
        if (!active) {
          return;
        }

        if (caught instanceof AuthenticationRequiredError) {
          router.replace("/login");
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load announcements.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initialLoad();

    return () => {
      active = false;
    };
  }, [router]);

  async function retryLoad() {
    setLoading(true);
    setError("");

    try {
      setAnnouncements(await fetchAnnouncements());
    } catch (caught) {
      if (caught instanceof AuthenticationRequiredError) {
        router.replace("/login");
        return;
      }

      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load announcements.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function publishAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setPublishing(true);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.get("title"),
          body: formData.get("body"),
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as AnnouncementsResponse;

      if (!response.ok || !data.announcement) {
        throw new Error(data.error ?? "Unable to publish the announcement.");
      }

      setAnnouncements((current) => [data.announcement!, ...current]);
      formElement.reset();
      setComposerOpen(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to publish.",
      );
    } finally {
      setPublishing(false);
    }
  }

  async function logout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#dfe5dc] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#174f3f] text-sm font-black text-white">
              TH
            </span>
            <div>
              <p className="font-semibold leading-tight">Team Hub</p>
              <p className="text-xs text-[#657269]">Internal workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-[#657269]">{user.email}</p>
            </div>
            <button
              className="focus-ring rounded-xl border border-[#dfe5dc] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#f1f4ee] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={logout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#174f3f]">
              Team updates
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Announcements
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-[#657269]">
              The latest news, decisions, and celebrations from across the
              team.
            </p>
          </div>

          <button
            className="focus-ring rounded-xl bg-[#174f3f] px-5 py-3 font-semibold text-white transition hover:bg-[#0d382c]"
            type="button"
            onClick={() => {
              setComposerOpen((open) => !open);
              setFormError("");
            }}
            aria-expanded={composerOpen}
            aria-controls="announcement-composer"
          >
            {composerOpen ? "Close composer" : "+ New announcement"}
          </button>
        </div>

        {composerOpen && (
          <form
            className="mt-8 rounded-2xl border border-[#dfe5dc] bg-white p-5 shadow-[0_16px_50px_rgba(23,79,63,0.08)] sm:p-7"
            id="announcement-composer"
            onSubmit={publishAnnouncement}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Share an update</h2>
              <p className="mt-1 text-sm text-[#657269]">
                Keep it clear, useful, and easy to scan.
              </p>
            </div>

            <label className="mb-2 block text-sm font-semibold" htmlFor="title">
              Title
            </label>
            <input
              className="focus-ring mb-5 h-12 w-full rounded-xl border border-[#d6ded5] px-4 outline-none focus:border-[#174f3f]"
              id="title"
              name="title"
              minLength={3}
              maxLength={100}
              placeholder="What’s the update?"
              required
            />

            <label className="mb-2 block text-sm font-semibold" htmlFor="body">
              Message
            </label>
            <textarea
              className="focus-ring min-h-36 w-full resize-y rounded-xl border border-[#d6ded5] p-4 outline-none focus:border-[#174f3f]"
              id="body"
              name="body"
              minLength={10}
              maxLength={1000}
              placeholder="Share the details your team needs to know…"
              required
            />

            {formError && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                className="focus-ring rounded-xl bg-[#174f3f] px-5 py-3 font-semibold text-white hover:bg-[#0d382c] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={publishing}
              >
                {publishing ? "Publishing…" : "Publish announcement"}
              </button>
            </div>
          </form>
        )}

        <section className="mt-10" aria-label="Announcement feed">
          {loading && (
            <div
              className="space-y-4"
              aria-label="Loading announcements"
              aria-busy="true"
            >
              {[1, 2, 3].map((item) => (
                <div
                  className="h-40 animate-pulse rounded-2xl border border-[#dfe5dc] bg-white"
                  key={item}
                />
              ))}
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-6"
              role="alert"
            >
              <p className="font-semibold text-red-800">
                We couldn’t load the feed.
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                className="mt-4 text-sm font-semibold underline"
                type="button"
                onClick={retryLoad}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && announcements.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cbd5c9] bg-white/60 px-6 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eaf4dc] text-xl">
                ✦
              </span>
              <h2 className="mt-4 text-xl font-semibold">
                Start the conversation
              </h2>
              <p className="mt-2 text-[#657269]">
                Publish the first announcement for your team.
              </p>
            </div>
          )}

          {!loading && !error && announcements.length > 0 && (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <article
                  className="rounded-2xl border border-[#dfe5dc] bg-white p-6 transition hover:border-[#b9c8b9] hover:shadow-[0_12px_40px_rgba(23,79,63,0.06)] sm:p-7"
                  key={announcement.id}
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eaf4dc] font-bold text-[#174f3f]">
                      {announcement.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold tracking-[-0.02em]">
                        {announcement.title}
                      </h2>
                      <p className="mt-1 text-xs text-[#77837a]">
                        {announcement.authorName} ·{" "}
                        {formatDate(announcement.createdAt)}
                      </p>
                      <p className="mt-5 whitespace-pre-wrap leading-7 text-[#3f4b43]">
                        {announcement.body}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
