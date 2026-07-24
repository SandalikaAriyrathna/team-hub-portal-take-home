"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PortalLayout } from "@/layouts/PortalLayout";
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

type FeedView = "active" | "hidden";

class AuthenticationRequiredError extends Error {}

async function fetchAnnouncements(view: FeedView) {
  const response = await fetch(
    view === "hidden"
      ? "/api/announcements?hidden=true"
      : "/api/announcements",
  );

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBody, setEditingBody] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [itemError, setItemError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [feedView, setFeedView] = useState<FeedView>("active");

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const loadedAnnouncements = await fetchAnnouncements(feedView);

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
  }, [feedView, router]);

  async function retryLoad() {
    setLoading(true);
    setError("");

    try {
      setAnnouncements(await fetchAnnouncements(feedView));
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

  function startEditing(announcement: Announcement) {
    setEditingId(announcement.id);
    setEditingTitle(announcement.title);
    setEditingBody(announcement.body);
    setItemError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
    setEditingBody("");
  }

  async function saveAnnouncement(
    event: FormEvent<HTMLFormElement>,
    announcementId: string,
  ) {
    event.preventDefault();
    setSavingId(announcementId);
    setItemError("");

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingTitle,
          body: editingBody,
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as AnnouncementsResponse;

      if (!response.ok || !data.announcement) {
        throw new Error(data.error ?? "Unable to update the announcement.");
      }

      setAnnouncements((current) =>
        current.map((announcement) =>
          announcement.id === announcementId
            ? data.announcement!
            : announcement,
        ),
      );
      cancelEditing();
    } catch (caught) {
      setItemError(
        caught instanceof Error ? caught.message : "Unable to update.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteAnnouncement(announcement: Announcement) {
    const confirmed = window.confirm(
      `Delete “${announcement.title}”? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(announcement.id);
    setItemError("");

    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as AnnouncementsResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete the announcement.");
      }

      setAnnouncements((current) =>
        current.filter((item) => item.id !== announcement.id),
      );

      if (editingId === announcement.id) {
        cancelEditing();
      }
    } catch (caught) {
      setItemError(
        caught instanceof Error ? caught.message : "Unable to delete.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function hideAnnouncement(announcement: Announcement) {
    const confirmed = window.confirm(
      `Hide “${announcement.title}” from the feed?`,
    );

    if (!confirmed) {
      return;
    }

    setHidingId(announcement.id);
    setItemError("");

    try {
      const response = await fetch(
        `/api/announcements/${announcement.id}/hide`,
        {
          method: "PATCH",
        },
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as AnnouncementsResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to hide the announcement.");
      }

      setAnnouncements((current) =>
        current.filter((item) => item.id !== announcement.id),
      );

      if (editingId === announcement.id) {
        cancelEditing();
      }
    } catch (caught) {
      setItemError(
        caught instanceof Error ? caught.message : "Unable to hide.",
      );
    } finally {
      setHidingId(null);
    }
  }

  async function restoreAnnouncement(announcement: Announcement) {
    setRestoringId(announcement.id);
    setItemError("");

    try {
      const response = await fetch(
        `/api/announcements/${announcement.id}/unhide`,
        {
          method: "PATCH",
        },
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as AnnouncementsResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to restore the announcement.");
      }

      setAnnouncements((current) =>
        current.filter((item) => item.id !== announcement.id),
      );

      if (editingId === announcement.id) {
        cancelEditing();
      }
    } catch (caught) {
      setItemError(
        caught instanceof Error ? caught.message : "Unable to restore.",
      );
    } finally {
      setRestoringId(null);
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
    <PortalLayout>
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
              {feedView === "active" ? "Team updates" : "Hidden items"}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {feedView === "active"
                ? "Announcements"
                : "Hidden announcements"}
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-[#657269]">
              {feedView === "active"
                ? "The latest news, decisions, and celebrations from across the team."
                : "Restore an announcement to return it to the team feed."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="focus-ring rounded-xl border border-[#dfe5dc] bg-white px-5 py-3 font-semibold transition hover:bg-[#f1f4ee]"
              type="button"
              onClick={() => {
                setFeedView((current) =>
                  current === "active" ? "hidden" : "active",
                );
                setComposerOpen(false);
                setItemError("");
                setError("");
                setLoading(true);
                cancelEditing();
              }}
            >
              {feedView === "active"
                ? "View hidden"
                : "Back to announcements"}
            </button>

            {feedView === "active" && (
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
            )}
          </div>
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
          {itemError && (
            <p
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {itemError}
            </p>
          )}

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
                {feedView === "active"
                  ? "Start the conversation"
                  : "No hidden announcements"}
              </h2>
              <p className="mt-2 text-[#657269]">
                {feedView === "active"
                  ? "Publish the first announcement for your team."
                  : "Announcements you hide will appear here."}
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
                      {editingId === announcement.id ? (
                        <form
                          onSubmit={(event) =>
                            saveAnnouncement(event, announcement.id)
                          }
                        >
                          <label
                            className="mb-2 block text-sm font-semibold"
                            htmlFor={`edit-title-${announcement.id}`}
                          >
                            Title
                          </label>
                          <input
                            className="focus-ring h-11 w-full rounded-xl border border-[#d6ded5] px-4 outline-none focus:border-[#174f3f]"
                            id={`edit-title-${announcement.id}`}
                            value={editingTitle}
                            onChange={(event) =>
                              setEditingTitle(event.target.value)
                            }
                            minLength={3}
                            maxLength={100}
                            required
                          />
                          <label
                            className="mb-2 mt-4 block text-sm font-semibold"
                            htmlFor={`edit-body-${announcement.id}`}
                          >
                            Message
                          </label>
                          <textarea
                            className="focus-ring min-h-32 w-full resize-y rounded-xl border border-[#d6ded5] p-4 outline-none focus:border-[#174f3f]"
                            id={`edit-body-${announcement.id}`}
                            value={editingBody}
                            onChange={(event) =>
                              setEditingBody(event.target.value)
                            }
                            minLength={10}
                            maxLength={1000}
                            required
                          />
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              className="focus-ring rounded-xl bg-[#174f3f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                              type="submit"
                              disabled={savingId === announcement.id}
                            >
                              {savingId === announcement.id
                                ? "Saving…"
                                : "Save changes"}
                            </button>
                            <button
                              className="focus-ring rounded-xl border border-[#dfe5dc] px-4 py-2 text-sm font-semibold"
                              type="button"
                              onClick={cancelEditing}
                              disabled={savingId === announcement.id}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                                {announcement.title}
                              </h2>
                              <p className="mt-1 text-xs text-[#77837a]">
                                {announcement.authorName} ·{" "}
                                {formatDate(announcement.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                className="focus-ring rounded-lg border border-[#dfe5dc] px-3 py-1.5 text-sm font-semibold hover:bg-[#f1f4ee]"
                                type="button"
                                onClick={() => startEditing(announcement)}
                              >
                                Edit
                              </button>
                              {feedView === "active" ? (
                                <button
                                  className="focus-ring rounded-lg border border-[#dfe5dc] px-3 py-1.5 text-sm font-semibold hover:bg-[#f1f4ee] disabled:cursor-not-allowed disabled:opacity-60"
                                  type="button"
                                  onClick={() => hideAnnouncement(announcement)}
                                  disabled={hidingId === announcement.id}
                                >
                                  {hidingId === announcement.id
                                    ? "Hiding…"
                                    : "Hide"}
                                </button>
                              ) : (
                                <button
                                  className="focus-ring rounded-lg border border-[#dfe5dc] px-3 py-1.5 text-sm font-semibold hover:bg-[#f1f4ee] disabled:cursor-not-allowed disabled:opacity-60"
                                  type="button"
                                  onClick={() =>
                                    restoreAnnouncement(announcement)
                                  }
                                  disabled={restoringId === announcement.id}
                                >
                                  {restoringId === announcement.id
                                    ? "Restoring…"
                                    : "Restore"}
                                </button>
                              )}
                              <button
                                className="focus-ring rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={() => deleteAnnouncement(announcement)}
                                disabled={deletingId === announcement.id}
                              >
                                {deletingId === announcement.id
                                  ? "Deleting…"
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                          <p className="mt-5 whitespace-pre-wrap leading-7 text-[#3f4b43]">
                            {announcement.body}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </PortalLayout>
  );
}
