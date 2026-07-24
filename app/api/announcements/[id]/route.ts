import { Types } from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { getSession } from "@/lib/session";
import { announcementSchema } from "@/lib/validation";
import { Announcement } from "@/models/Announcement";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeAnnouncement(announcement: {
  _id: Types.ObjectId;
  title: string;
  body: string;
  authorName: string;
  createdAt: Date;
}) {
  return {
    id: announcement._id.toString(),
    title: announcement.title,
    body: announcement.body,
    authorName: announcement.authorName,
    createdAt: announcement.createdAt.toISOString(),
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Announcement not found." },
      { status: 404 },
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

    const announcement = await Announcement.findOneAndUpdate(
      {
        _id: id,
        authorId: session.userId,
      },
      parsed.data,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      announcement: serializeAnnouncement(announcement),
    });
  } catch (error) {
    console.error("Failed to update announcement", error);

    return NextResponse.json(
      { error: "Unable to update the announcement." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Announcement not found." },
      { status: 404 },
    );
  }

  try {
    await connectToDatabase();

    const announcement = await Announcement.findOneAndDelete({
      _id: id,
      authorId: session.userId,
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete announcement", error);

    return NextResponse.json(
      { error: "Unable to delete the announcement." },
      { status: 500 },
    );
  }
}
