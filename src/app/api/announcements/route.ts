import { Types } from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { getSession } from "@/lib/session";
import { announcementSchema } from "@/lib/validation";
import { Announcement } from "@/models/Announcement";

type AnnouncementResponse = {
  _id: Types.ObjectId;
  title: string;
  body: string;
  authorName: string;
  createdAt: Date;
};

function serializeAnnouncement(announcement: AnnouncementResponse) {
  return {
    id: announcement._id.toString(),
    title: announcement.title,
    body: announcement.body,
    authorName: announcement.authorName,
    createdAt: announcement.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const showHidden =
      new URL(request.url).searchParams.get("hidden") === "true";
    const announcements = await Announcement.find(
      showHidden
        ? { hidden: true }
        : {
            hidden: { $ne: true },
          },
    )
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      announcements: announcements.map(serializeAnnouncement),
    });
  } catch (error) {
    console.error("Failed to load announcements", error);

    return NextResponse.json(
      { error: "Unable to load announcements." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const parsed = announcementSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid announcement.",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const announcement = await Announcement.create({
      ...parsed.data,
      authorId: session.userId,
      authorName: session.name,
    });

    return NextResponse.json(
      { announcement: serializeAnnouncement(announcement) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create announcement", error);

    return NextResponse.json(
      { error: "Unable to publish the announcement." },
      { status: 500 },
    );
  }
}
