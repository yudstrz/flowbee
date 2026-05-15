import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function POST() {
  const results: string[] = [];

  // ═══════════════════════════════════════════════════════
  // PHASE 1: Create Missing Tables
  // ═══════════════════════════════════════════════════════
  const tables = [
    {
      desc: "Create departments table",
      sql: `CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      desc: "Create logbook_entries table",
      sql: `CREATE TABLE IF NOT EXISTS logbook_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        type TEXT DEFAULT 'note',
        title TEXT,
        content TEXT,
        mood TEXT,
        energy TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      desc: "Create attendance table",
      sql: `CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        check_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        check_in_type TEXT DEFAULT 'WFO',
        office_id TEXT,
        notes TEXT,
        lat REAL,
        lng REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      desc: "Create global_settings table",
      sql: `CREATE TABLE IF NOT EXISTS global_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`
    },
    {
      desc: "Create rewards table",
      sql: `CREATE TABLE IF NOT EXISTS rewards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        points_cost INTEGER NOT NULL,
        category TEXT,
        tone TEXT,
        glyph TEXT,
        description TEXT,
        stock INTEGER DEFAULT 999
      )`
    },
  ];

  for (const t of tables) {
    try {
      await db.execute(t.sql);
      results.push(`✅ ${t.desc}`);
    } catch (e: any) {
      results.push(`❌ ${t.desc}: ${e.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 2: Add Missing Columns (ALTER TABLE)
  // ═══════════════════════════════════════════════════════
  const columns = [
    // ── Users table ──
    { desc: "users.coins", sql: "ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0" },
    { desc: "users.manager_id", sql: "ALTER TABLE users ADD COLUMN manager_id TEXT" },
    { desc: "users.department", sql: "ALTER TABLE users ADD COLUMN department TEXT" },
    { desc: "users.user_role_context", sql: "ALTER TABLE users ADD COLUMN user_role_context TEXT" },
    { desc: "users.last_activity_at", sql: "ALTER TABLE users ADD COLUMN last_activity_at TEXT" },
    { desc: "users.personal_wellbeing_goal", sql: "ALTER TABLE users ADD COLUMN personal_wellbeing_goal TEXT" },
    { desc: "users.wellbeing_routine", sql: "ALTER TABLE users ADD COLUMN wellbeing_routine TEXT" },
    { desc: "users.avatar_image", sql: "ALTER TABLE users ADD COLUMN avatar_image TEXT" },
    { desc: "users.is_onboarded", sql: "ALTER TABLE users ADD COLUMN is_onboarded INTEGER DEFAULT 0" },

    // ── Goals table ──
    { desc: "goals.parent_id", sql: "ALTER TABLE goals ADD COLUMN parent_id TEXT" },
    { desc: "goals.assigned_by_id", sql: "ALTER TABLE goals ADD COLUMN assigned_by_id TEXT" },
    { desc: "goals.status", sql: "ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'pending'" },
    { desc: "goals.is_kpi", sql: "ALTER TABLE goals ADD COLUMN is_kpi INTEGER DEFAULT 0" },
    { desc: "goals.owner_name", sql: "ALTER TABLE goals ADD COLUMN owner_name TEXT" },

    // ── Daily Priorities table ──
    { desc: "daily_priorities.goal_id", sql: "ALTER TABLE daily_priorities ADD COLUMN goal_id TEXT" },
    { desc: "daily_priorities.is_verified", sql: "ALTER TABLE daily_priorities ADD COLUMN is_verified INTEGER DEFAULT 0" },
  ];

  for (const c of columns) {
    try {
      await db.execute(c.sql);
      results.push(`✅ Added ${c.desc}`);
    } catch (e: any) {
      if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
        results.push(`⏭️ ${c.desc} (already exists)`);
      } else {
        results.push(`❌ ${c.desc}: ${e.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 3: Seed default departments if empty
  // ═══════════════════════════════════════════════════════
  try {
    const deptCheck = await db.execute("SELECT COUNT(*) as cnt FROM departments");
    const deptCount = Number(deptCheck.rows[0]?.cnt) || 0;
    if (deptCount === 0) {
      const defaultDepts = ["Product", "Engineering", "Marketing", "HR", "Finance", "Operations", "Design"];
      for (const dept of defaultDepts) {
        await db.execute({ sql: "INSERT OR IGNORE INTO departments (name) VALUES (?)", args: [dept] });
      }
      results.push(`✅ Seeded ${defaultDepts.length} default departments`);
    } else {
      results.push(`⏭️ Departments already populated (${deptCount})`);
    }
  } catch (e: any) {
    results.push(`❌ Seed departments: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 4: Backfill manager_id for existing seed data
  // ═══════════════════════════════════════════════════════
  try {
    // Set employees in "Digital Experience" team to report to manager "user_manager" (Budi Santoso)
    const managerCheck = await db.execute({
      sql: "SELECT id FROM users WHERE id = 'user_manager'",
      args: []
    });
    if (managerCheck.rows.length > 0) {
      // Set all employees to report to Budi Santoso if they don't have a manager yet
      await db.execute({
        sql: "UPDATE users SET manager_id = 'user_manager' WHERE role = 'employee' AND (manager_id IS NULL OR manager_id = '')",
        args: []
      });
      results.push("✅ Backfilled manager_id for existing employees → user_manager");
    } else {
      results.push("⏭️ No user_manager found, skipping backfill");
    }
  } catch (e: any) {
    results.push(`❌ Backfill manager_id: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 5: Backfill department for existing seed data
  // ═══════════════════════════════════════════════════════
  try {
    // Map team_id to department names
    const teamsRes = await db.execute("SELECT id, name FROM teams");
    for (const team of teamsRes.rows) {
      // Find a matching department name
      let deptName = String(team.name);
      // Map team names to department categories
      if (deptName.includes("Digital") || deptName.includes("Product")) deptName = "Product";
      else if (deptName.includes("Engineer")) deptName = "Engineering";
      else if (deptName.includes("Market") || deptName.includes("Growth")) deptName = "Marketing";
      else if (deptName.includes("People") || deptName.includes("Culture") || deptName.includes("HR")) deptName = "HR";

      await db.execute({
        sql: "UPDATE users SET department = ? WHERE team_id = ? AND (department IS NULL OR department = '')",
        args: [deptName, String(team.id)]
      });
    }
    results.push("✅ Backfilled department from teams for existing users");
  } catch (e: any) {
    results.push(`❌ Backfill department: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 6: Cleanup legacy tables
  // ═══════════════════════════════════════════════════════
  try {
    await db.execute("DROP TABLE IF EXISTS director_questions");
    results.push("✅ Cleaned up legacy tables");
  } catch (e: any) {
    results.push(`❌ Cleanup: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 7: Verify final state
  // ═══════════════════════════════════════════════════════
  const verification: string[] = [];
  try {
    const usersSchema = await db.execute("PRAGMA table_info(users)");
    const userCols = usersSchema.rows.map(r => String(r.name));
    const requiredUserCols = ["manager_id", "department", "coins", "user_role_context", "is_onboarded"];
    for (const col of requiredUserCols) {
      verification.push(userCols.includes(col) ? `✅ users.${col}` : `❌ users.${col} MISSING`);
    }

    const goalsSchema = await db.execute("PRAGMA table_info(goals)");
    const goalCols = goalsSchema.rows.map(r => String(r.name));
    const requiredGoalCols = ["parent_id", "assigned_by_id", "status", "is_kpi"];
    for (const col of requiredGoalCols) {
      verification.push(goalCols.includes(col) ? `✅ goals.${col}` : `❌ goals.${col} MISSING`);
    }

    const dpSchema = await db.execute("PRAGMA table_info(daily_priorities)");
    const dpCols = dpSchema.rows.map(r => String(r.name));
    const requiredDpCols = ["goal_id", "is_verified"];
    for (const col of requiredDpCols) {
      verification.push(dpCols.includes(col) ? `✅ daily_priorities.${col}` : `❌ daily_priorities.${col} MISSING`);
    }

    // Check departments table
    const deptCount = await db.execute("SELECT COUNT(*) as cnt FROM departments");
    verification.push(`✅ departments table: ${deptCount.rows[0]?.cnt} entries`);

    // Check manager assignments
    const managedUsers = await db.execute("SELECT COUNT(*) as cnt FROM users WHERE manager_id IS NOT NULL AND manager_id != ''");
    verification.push(`✅ Users with manager: ${managedUsers.rows[0]?.cnt}`);

    // Check department assignments
    const deptUsers = await db.execute("SELECT COUNT(*) as cnt FROM users WHERE department IS NOT NULL AND department != ''");
    verification.push(`✅ Users with department: ${deptUsers.rows[0]?.cnt}`);

  } catch (e: any) {
    verification.push(`❌ Verification error: ${e.message}`);
  }

  return NextResponse.json({ 
    results, 
    verification,
    summary: `Migration complete. ${results.filter(r => r.startsWith('✅')).length} successful, ${results.filter(r => r.startsWith('⏭️')).length} skipped, ${results.filter(r => r.startsWith('❌')).length} failed.`
  });
}

// Also allow GET for easy browser access
export async function GET() {
  return POST();
}
