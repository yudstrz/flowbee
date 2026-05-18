import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function POST(request: Request) {
  try {
    const { userId, name, avatarImage } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "UserId required" }, { status: 400 });
    }

    if (avatarImage !== undefined) {
      await db.execute({
        sql: "UPDATE users SET name = ?, avatar_image = ? WHERE id = ?",
        args: [name, avatarImage, userId]
      });
    } else {
      await db.execute({
        sql: "UPDATE users SET name = ? WHERE id = ?",
        args: [name, userId]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 });
  }
}
