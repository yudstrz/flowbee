import { NextResponse } from 'next/server';
import { db } from '@/lib/turso';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'UserId missing' }, { status: 400 });

    // Auto-migrate: ensure tables exist
    try {
      // Use a more standard syntax for checking if column exists in SQLite/LibSQL
      const tableInfo = await db.execute(`PRAGMA table_info(users)`);
      const hasOnboarded = tableInfo.rows.some(r => r.name === 'is_onboarded');
      if (!hasOnboarded) {
        await db.execute("ALTER TABLE users ADD COLUMN is_onboarded INTEGER DEFAULT 0");
      }
    } catch (e) {
      console.error("Migration error (users):", e);
    }
    try {
      const tableInfo = await db.execute(`PRAGMA table_info(daily_priorities)`);
      const hasVerified = tableInfo.rows.some(r => r.name === 'is_verified');
      if (!hasVerified) {
        await db.execute("ALTER TABLE daily_priorities ADD COLUMN is_verified INTEGER DEFAULT 0");
      }
    } catch (e) {
      console.error("Migration error (daily_priorities):", e);
    }
    try {
      await db.execute(`CREATE TABLE IF NOT EXISTS rewards (
         id TEXT PRIMARY KEY,
         title TEXT NOT NULL,
         points_cost INTEGER NOT NULL,
         category TEXT,
         tone TEXT,
         glyph TEXT,
         description TEXT,
         stock INTEGER DEFAULT 999
       )`);
    } catch (e) { }

    // 1. Fetch User
    const userRes = await db.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [userId]
    });
    const userRow = userRes.rows[0];
    if (!userRow) return NextResponse.json({ state: null, user: null });

    const user = {
      id: userRow.id,
      name: userRow.name,
      role: userRow.role,
      streak: userRow.streak,
      points: userRow.points,
      coins: userRow.coins,
      level: userRow.level,
      rank: userRow.rank,
      avatarImage: userRow.avatar_image,
      userRole: userRow.user_role_context || userRow.role,
      onboarded: !!userRow.is_onboarded
    };

    // 2. Fetch State components
    const prioritiesRes = await db.execute({
      sql: "SELECT * FROM daily_priorities WHERE user_id = ?",
      args: [userId]
    });
    const priorities = prioritiesRes.rows.map(r => ({
      id: r.id, title: r.title, goal: r.goal_title, goal_id: r.goal_id, energy: r.energy_level, est: r.est_time, done: !!r.is_done, verified: !!r.is_verified, tone: r.tone
    }));


    const habitsRes = await db.execute({
      sql: "SELECT * FROM habits WHERE user_id = ?",
      args: [userId]
    });
    const habits = habitsRes.rows.map(r => ({
      name: r.name, streak: r.streak, target: r.target_days, done: !!r.is_done_today, glyph: r.glyph
    }));

    // Fetch Goals with Owner Names and Sub-goals
    const goalsRes = await db.execute({
      sql: `SELECT g.*, u.name as joined_owner_name 
            FROM goals g 
            LEFT JOIN users u ON g.owner_id = u.id 
            WHERE g.owner_id = ? 
               OR g.assigned_by_id = ? 
               OR g.scope IN ('company', 'team')
               OR g.owner_id IN (SELECT id FROM users WHERE manager_id = ?)`,
      args: [userId, userId, userId]
    });

    const goals = await Promise.all(goalsRes.rows.map(async (r) => {
      const subGoalsRes = await db.execute({
        sql: "SELECT * FROM sub_goals WHERE goal_id = ?",
        args: [String(r.id)]
      });

      // Roll-up progress from child goals (aligned to this goal)
      const childGoalsRes = await db.execute({
        sql: "SELECT progress FROM goals WHERE parent_id = ?",
        args: [String(r.id)]
      });
      let effectiveProgress = Number(r.progress) || 0;
      if (childGoalsRes.rows.length > 0) {
        effectiveProgress = Math.round(
          childGoalsRes.rows.reduce((sum: number, cr: any) => sum + (Number(cr.progress) || 0), 0) / childGoalsRes.rows.length
        );
      }

      // Parse due_date: detect ISO vs display format, return both
      const rawDue = (r.due_date as string) || '';
      let dueDisplay = rawDue;
      let dueISO = '';
      if (rawDue.includes('T')) {
        // Already ISO format
        dueISO = rawDue.slice(0, 16);
        try {
          const d = new Date(rawDue);
          if (!isNaN(d.getTime())) {
            dueDisplay = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {}
      }

      return {
        id: r.id,
        title: r.title,
        progress: effectiveProgress,
        alignment: r.alignment,
        due: dueDisplay,
        dueISO: dueISO,
        tone: r.tone,
        metric: childGoalsRes.rows.length > 0 ? `${childGoalsRes.rows.length} aligned OKR` : r.metric,
        scope: r.scope,
        owner: (r.joined_owner_name as string) || (r.owner_name as string) || 'Unknown',
        ownerId: r.owner_id,
        assignedById: r.assigned_by_id,
        parent_id: r.parent_id,
        status: r.status || 'pending',
        is_kpi: !!r.is_kpi,
        subGoals: subGoalsRes.rows.map(sr => ({ id: sr.id, title: sr.title, done: !!sr.is_done }))
      };
    }));

    const surveysRes = await db.execute("SELECT * FROM surveys WHERE status = 'active'");
    const surveys = surveysRes.rows.map(r => ({
      id: r.id, title: r.title, url: r.url, publishedAt: r.published_at, status: r.status
    }));

    // Fetch Latest Mood Checkin
    const moodRes = await db.execute({
      sql: "SELECT mood_key, energy_key, tag FROM mood_checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      args: [userId]
    });
    const latestMood = moodRes.rows[0];

    // Fetch Kudos for Feed (Correlated)
    const kudosRes = await db.execute({
      sql: `SELECT k.*, s.name as sender_name, r.name as receiver_name 
            FROM kudos k 
            JOIN users s ON k.sender_id = s.id 
            JOIN users r ON k.receiver_id = r.id 
            ORDER BY k.created_at DESC LIMIT 10`,
    });
    const feed = kudosRes.rows.map(r => ({
      id: r.id, from: r.sender_name, to: r.receiver_name, value: r.value_tag, msg: r.message, likes: r.likes_count, time: 'Baru saja'
    }));

    // Fetch Skills
    const skillsRes = await db.execute({
      sql: "SELECT * FROM user_skills WHERE user_id = ?",
      args: [userId]
    });
    const skills = skillsRes.rows.map(r => ({
      name: r.name, current: r.current_level, target: r.target_level
    }));

    // Fetch Global Settings
    const settingsRes = await db.execute("SELECT * FROM global_settings");
    let contacts = [
      { id: '1', name: 'HR Helpdesk', role: 'Support & Admin', email: 'hr@company.com', phone: '021-1234567' },
      { id: '2', name: 'IT Support', role: 'Technical Issues', email: 'it@company.com', phone: '0812-3456-7890' },
      { id: '3', name: 'Security Office', role: 'Safety & Emergency', email: 'security@company.com', phone: '021-9876543' }
    ];
    let workSchedule = { start: "08:00", end: "17:00", breakStart: "12:00", breakEnd: "13:00" };
    settingsRes.rows.forEach(r => {
      try {
        if (r.key === 'contacts' && r.value) contacts = JSON.parse(r.value as string);
        if (r.key === 'work_schedule' && r.value) workSchedule = JSON.parse(r.value as string);
      } catch (e) { console.error(`Error parsing setting ${r.key}:`, e); }
    });

    // Fetch Today's Attendance
    const todayAttRes = await db.execute({
      sql: "SELECT check_in_at as created_at FROM attendance WHERE user_id = ? AND date(check_in_at, 'localtime') = date('now', 'localtime') ORDER BY check_in_at ASC LIMIT 1",
      args: [userId]
    });
    const checkIn = todayAttRes.rows[0]?.created_at as string;

    const todayReflectRes = await db.execute({
      sql: "SELECT created_at FROM logbook_entries WHERE user_id = ? AND type = 'daily_reflection' AND date(created_at, 'localtime') = date('now', 'localtime') ORDER BY created_at DESC LIMIT 1",
      args: [userId]
    });
    const checkOut = todayReflectRes.rows[0]?.created_at as string;

    let wellbeingRoutine = [];
    try {
      if (userRow.wellbeing_routine) {
        wellbeingRoutine = JSON.parse(userRow.wellbeing_routine as string);
      }
    } catch (e) { console.error("Failed to parse wellbeingRoutine:", e); }

    const formatTime = (iso: string | undefined) => {
      if (!iso) return undefined;
      try {
        const date = new Date(iso);
        if (isNaN(date.getTime())) return undefined;
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      } catch (e) { return undefined; }
    }

    const rewardsRes = await db.execute("SELECT * FROM rewards");
    const rewards = rewardsRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      points: Number(r.points_cost),
      category: r.category,
      tone: r.tone,
      glyph: r.glyph,
      description: r.description,
      stock: Number(r.stock)
    }));

    const state = {
      mood: latestMood?.mood_key || 'calm',
      energy: latestMood?.energy_key || 'mid',
      tag: latestMood?.tag || null,
      intention: "",
      priorities,
      weeklyPriorities: [],
      habits,
      goals,
      surveys,
      feed,
      skills,
      learning: [],
      wellbeing: { dims: [], programs: [], dailyPrompt: "" },
      points: user.points,
      coins: user.coins,
      notifications: 0,
      rewards,
      rewardHistory: [],
      logbook: [],
      lastActivityDate: userRow.last_activity_at,
      penaltyActive: false,
      penaltyThresholdDays: 3,
      workSchedule,
      todayAttendance: {
        checkIn: formatTime(checkIn),
        checkOut: formatTime(checkOut),
      },
      personalWellbeingGoal: (userRow.personal_wellbeing_goal as string) || "",
      wellbeingRoutine,
      contacts,
      onboarded: !!userRow.is_onboarded
    };

    return NextResponse.json({ state, user });
  } catch (error: any) {
    console.error("Turso Fetch Error:", error);
    return NextResponse.json({
      error: 'Failed to read data from Turso',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { state, user, userId } = await request.json();
    if (!user || !userId || !state) return NextResponse.json({ error: 'User data, state or ID missing' });

    // Update User
    try {
      await db.execute({
        sql: `UPDATE users SET name = ?, streak = ?, points = ?, coins = ?, level = ?, rank = ?, avatar_image = ?, user_role_context = ?, last_activity_at = ?, personal_wellbeing_goal = ?, wellbeing_routine = ?, is_onboarded = ? WHERE id = ?`,
        args: [
          user.name, user.streak, user.points, user.coins, user.level, user.rank,
          user.avatarImage || null,
          user.userRole || user.role, state.lastActivityDate,
          state.personalWellbeingGoal || "",
          JSON.stringify(state.wellbeingRoutine || []),
          state.onboarded ? 1 : 0,
          userId
        ]
      });
    } catch (e: any) {
      console.error("Failed to update user state:", e);
      // Fallback if column truly doesn't exist despite migration attempt
      if (e.message?.includes('is_onboarded')) {
        await db.execute({
          sql: `UPDATE users SET name = ?, streak = ?, points = ?, coins = ?, level = ?, rank = ?, avatar_image = ?, user_role_context = ?, last_activity_at = ?, personal_wellbeing_goal = ?, wellbeing_routine = ? WHERE id = ?`,
          args: [
            user.name, user.streak, user.points, user.coins, user.level, user.rank,
            user.avatarImage || null,
            user.userRole || user.role, state.lastActivityDate,
            state.personalWellbeingGoal || "",
            JSON.stringify(state.wellbeingRoutine || []),
            userId
          ]
        });
      } else throw e;
    }

    // Sync Rewards (Only HR can manage global rewards)
    // Check role or userRole context
    const activeRole = user.userRole || user.role;
    if (activeRole === 'hr' && state.rewards) {
      try {
        // Use a more robust sync: Delete and re-insert
        await db.execute("DELETE FROM rewards");
        for (const r of state.rewards) {
          await db.execute({
            sql: `INSERT INTO rewards (id, title, points_cost, category, tone, glyph, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [String(r.id), r.title, r.points, r.category || 'General', r.tone || 'blue', r.glyph || 'gift', r.description || '', r.stock || 0]
          });
        }
      } catch (e) {
        console.error("Reward sync error:", e);
      }
    }

    // Sync Daily Priorities
    if (state.priorities) {
      await db.execute({ 
        sql: "DELETE FROM daily_priorities WHERE user_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')", 
        args: [userId] 
      });
      for (const p of state.priorities) {
        await db.execute({
          sql: `INSERT INTO daily_priorities (user_id, title, goal_title, goal_id, energy_level, est_time, is_done, is_verified, tone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [userId, p.title, p.goal, p.goal_id || null, p.energy, p.est, p.done ? 1 : 0, p.verified ? 1 : 0, p.tone]
        });
      }
    }


    // Sync Habits
    if (state.habits) {
      await db.execute({ sql: "DELETE FROM habits WHERE user_id = ?", args: [userId] });
      for (const h of state.habits) {
        await db.execute({
          sql: `INSERT INTO habits (user_id, name, streak, target_days, is_done_today, glyph) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [userId, h.name, h.streak, h.target, h.done ? 1 : 0, h.glyph]
        });
      }
    }

    // Sync Goals
    if (state.goals) {
      const currentGoalIds = state.goals.map((g: any) => String(g.id));
      try {
        if (currentGoalIds.length > 0) {
          const placeholders = currentGoalIds.map(() => '?').join(',');
          await db.execute({
            sql: `DELETE FROM goals WHERE (owner_id = ? OR assigned_by_id = ?) AND id NOT IN (${placeholders})`,
            args: [userId, userId, ...currentGoalIds]
          });
        } else {
          await db.execute({
            sql: `DELETE FROM goals WHERE (owner_id = ? OR assigned_by_id = ?)`,
            args: [userId, userId]
          });
        }
      } catch (e) {
        console.error("Goal deletion sync error:", e);
      }

      for (const g of state.goals) {
        // We use INSERT OR REPLACE (UPSERT) logic
        await db.execute({
          sql: `INSERT INTO goals (id, owner_id, title, progress, alignment, due_date, tone, metric, scope, parent_id, assigned_by_id, status, is_kpi) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET 
                owner_id=excluded.owner_id, title=excluded.title, progress=excluded.progress, alignment=excluded.alignment, 
                due_date=excluded.due_date, tone=excluded.tone, metric=excluded.metric, 
                scope=excluded.scope, parent_id=excluded.parent_id, assigned_by_id=excluded.assigned_by_id,
                status=excluded.status, is_kpi=excluded.is_kpi`,
          args: [String(g.id), String(g.ownerId || userId), g.title, g.progress, g.alignment, g.dueISO || g.due, g.tone, g.metric, g.scope, g.parent_id || null, g.assignedById || null, g.status || 'pending', g.is_kpi ? 1 : 0]
        });

        // Sync Sub-goals
        if (g.subGoals) {
          await db.execute({ sql: "DELETE FROM sub_goals WHERE goal_id = ?", args: [String(g.id)] });
          for (const sg of g.subGoals) {
            await db.execute({
              sql: `INSERT INTO sub_goals (goal_id, title, is_done) VALUES (?, ?, ?)`,
              args: [String(g.id), sg.title, sg.done ? 1 : 0]
            });
          }
        }
      }
    }

    // Sync Skills
    if (state.skills) {
      await db.execute({ sql: "DELETE FROM user_skills WHERE user_id = ?", args: [userId] });
      for (const sk of state.skills) {
        await db.execute({
          sql: `INSERT INTO user_skills (user_id, name, current_level, target_level) VALUES (?, ?, ?, ?)`,
          args: [userId, sk.name, sk.current || 0, sk.target || 100]
        });
      }
    }

    // Sync Global Settings (Contacts, Work Schedule) - HR/Manager only
    if (user.role === 'hr') {
      if (state.contacts) {
        await db.execute({
          sql: `INSERT INTO global_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          args: ["contacts", JSON.stringify(state.contacts)]
        });
      }
      if (state.workSchedule) {
        await db.execute({
          sql: `INSERT INTO global_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          args: ["work_schedule", JSON.stringify(state.workSchedule)]
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Updated Turso successfully' });
  } catch (error: any) {
    console.error("Turso Sync Error:", error);
    return NextResponse.json({
      error: 'Failed to sync data to Turso',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
