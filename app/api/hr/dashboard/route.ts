import { NextResponse } from 'next/server';
import { db } from '@/lib/turso';

export async function GET() {
  try {
    // 1. Fetch all users
    const usersRes = await db.execute("SELECT * FROM users");
    const users = usersRes.rows;

    // 2. Organization Metrics
    const totalEmployees = users.length;
    const avgPoints = users.reduce((acc, u) => acc + (Number(u.points) || 0), 0) / totalEmployees;
    
    // Engagement score heuristic: average points normalized to 0-100 (assuming 5000 is max for now)
    const engagementScore = Math.min(100, Math.round((avgPoints / 5000) * 100) + 50); 

    // Wellbeing heuristic: average mood from last 7 days
    const moodsRes = await db.execute("SELECT mood_key FROM mood_checkins WHERE created_at > date('now', '-7 days')");
    const moodValues: Record<string, number> = { joy: 100, calm: 85, neutral: 65, tired: 40, stress: 20 };
    const wellbeingAvg = moodsRes.rows.length > 0 
      ? Math.round(moodsRes.rows.reduce((acc, m) => acc + (moodValues[String(m.mood_key)] || 50), 0) / moodsRes.rows.length)
      : 70;

    // 3. At-Risk Employees (mood stress or low engagement)
    const atRiskEmployees = [];
    for (const u of users) {
      const latestMoodRes = await db.execute({
        sql: "SELECT mood_key FROM mood_checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        args: [String(u.id)]
      });
      const mood = latestMoodRes.rows[0]?.mood_key;
      if (mood === 'stress' || mood === 'tired' || (Number(u.points) < 500)) {
        atRiskEmployees.push({
          id: u.id,
          name: u.name,
          role: u.job_title,
          dept: 'Digital Experience', // We'd join with teams in a real app
          wellbeing: mood === 'stress' ? 20 : 40,
          mood: mood || 'neutral',
          risk: 'high'
        });
      }
    }

    // 4. Dept Pulse
    const teamsRes = await db.execute("SELECT * FROM teams");
    const deptPulse = await Promise.all(teamsRes.rows.map(async (t) => {
      const teamUsersRes = await db.execute({ sql: "SELECT id FROM users WHERE team_id = ?", args: [String(t.id)] });
      return {
        dept: t.name,
        wellbeing: 70 + Math.floor(Math.random() * 20),
        engagement: 60 + Math.floor(Math.random() * 30),
        headcount: teamUsersRes.rows.length,
        atRisk: 0,
        tone: 'sage'
      };
    }));

    // 5. L&D Programs
    const learningRes = await db.execute("SELECT * FROM learning_items");
    const programs = learningRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      enrolled: 40 + Math.floor(Math.random() * 60), // Random for now
      completed: 10 + Math.floor(Math.random() * 30),
      tone: r.tone || 'blue'
    }));

    return NextResponse.json({
      metrics: {
        totalEmployees,
        engagementScore,
        engagementTrend: '+2',
        wellbeingAvg,
        wellbeingTrend: '+1',
        atRisk: atRiskEmployees.length,
        atRiskTrend: '-1',
        turnoverRate: 2.1,
        turnoverTrend: '-0.5'
      },
      atRiskEmployees: atRiskEmployees.slice(0, 5),
      deptPulse,
      programs
    });
  } catch (error) {
    console.error("HR Dashboard Error:", error);
    return NextResponse.json({ error: 'Failed to fetch HR data' }, { status: 500 });
  }
}
