import { Types } from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Announcement } from "@/models/Announcement";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, { params }: RouteContext) {
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

    const announcement = await Announcement.findOneAndUpdate(
      {
        _id: id,
        authorId: session.userId,
        hidden: { $ne: true },
      },
      {
        hidden: true,
      },
      {
        returnDocument: "after",
      },
    );

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to hide announcement", error);

    return NextResponse.json(
      { error: "Unable to hide the announcement." },
      { status: 500 },
    );
  }
}
