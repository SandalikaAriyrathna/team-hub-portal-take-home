import { NextResponse } from "next/server";

import { authenticateAdmin } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid login details.",
        },
        { status: 400 },
      );
    }

    const user = await authenticateAdmin(
      parsed.data.email,
      parsed.data.password,
    );

    if (!user) {
      return NextResponse.json(
        { error: "The email or password is incorrect." },
        { status: 401 },
      );
    }

    await createSession({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Login failed", error);

    return NextResponse.json(
      {
        error:
          "Unable to sign in. Check the server configuration and try again.",
      },
      { status: 500 },
    );
  }
}
