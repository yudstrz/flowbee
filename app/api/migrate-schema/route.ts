import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function POST() {
  const results: string[] = [];

  const migrations = [
    { desc: "Add coins to users", sql: "ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0" },
    { desc: "Add status to goals", sql: "ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'pending'" },
    { desc: "Add is_kpi to goals", sql: "ALTER TABLE goals ADD COLUMN is_kpi INTEGER DEFAULT 0" },
    { desc: "Add goal_id to daily_priorities", sql: "ALTER TABLE daily_priorities ADD COLUMN goal_id TEXT" },
    { desc: "Add user_role_context to users", sql: "ALTER TABLE users ADD COLUMN user_role_context TEXT" },
    { desc: "Add last_activity_at to users", sql: "ALTER TABLE users ADD COLUMN last_activity_at TEXT" },
    { desc: "Add personal_wellbeing_goal to users", sql: "ALTER TABLE users ADD COLUMN personal_wellbeing_goal TEXT" },
    { desc: "Add wellbeing_routine to users", sql: "ALTER TABLE users ADD COLUMN wellbeing_routine TEXT" },
    { desc: "Add owner_name to goals", sql: "ALTER TABLE goals ADD COLUMN owner_name TEXT" },
    { desc: "Remove legacy director_questions", sql: "DROP TABLE IF EXISTS director_questions" },
  ];

  for (const m of migrations) {
    try {
      await db.execute(m.sql);
      results.push(`✅ ${m.desc}`);
    } catch (e: any) {
      if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
        results.push(`⏭️ ${m.desc} (already exists)`);
      } else {
        results.push(`❌ ${m.desc}: ${e.message}`);
      }
    }
  }

  return NextResponse.json({ results });
}
