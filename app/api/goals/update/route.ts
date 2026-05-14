import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function POST(req: Request) {
  try {
    const { goalId, progress, parentId, metric } = await req.json();
    
    if (!goalId) {
      return NextResponse.json({ error: "goalId required" }, { status: 400 });
    }

    const updates: string[] = [];
    const args: any[] = [];

    if (progress !== undefined) {
      updates.push("progress = ?");
      args.push(progress);
    }
    if (parentId !== undefined) {
      updates.push("parent_id = ?");
      args.push(parentId);
    }
    if (metric !== undefined) {
      updates.push("metric = ?");
      args.push(metric);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    args.push(goalId);
    await db.execute({
      sql: `UPDATE goals SET ${updates.join(", ")} WHERE id = ?`,
      args
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}
