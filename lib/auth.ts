import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 8) {
    throw new Error(
      "ADMIN_EMAIL and a password of at least 8 characters are required.",
    );
  }

  return { email, password };
}

export async function authenticateAdmin(email: string, password: string) {
  const config = getAdminConfig();

  if (email !== config.email || password !== config.password) {
    return null;
  }

  await connectToDatabase();

  let user = await User.findOne({ email: config.email }).select(
    "+passwordHash",
  );

  if (!user) {
    user = await User.create({
      name: "Portal Admin",
      email: config.email,
      passwordHash: await bcrypt.hash(config.password, 12),
      role: "admin",
    });
  }

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
