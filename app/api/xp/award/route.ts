import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

const XP_VALUES: Record<string, number> = {
  priority_complete: 50,
  habit_complete: 30,
  survey_complete: 100,
  goal_complete: 500,
  kudos_received: 20,
};

export async function POST(request: Request) {
  try {
    const { userId, actionType, description } = await request.json();

    if (!userId || !actionType) {
      return NextResponse.json({ error: "UserId and ActionType required" }, { status: 400 });
    }

    const amount = XP_VALUES[actionType] || 10;
    const coinsAmount = Math.floor(amount / 4); // 4:1 Ratio
    const txId = "tx_" + Math.random().toString(36).substring(2, 9);

    // 1. Log Transaction (Optional, don't crash if table missing)
    try {
      await db.execute({
        sql: "INSERT INTO xp_transactions (id, user_id, amount, action_type, description) VALUES (?, ?, ?, ?, ?)",
        args: [txId, userId, amount, actionType, description || actionType]
      });
    } catch (e) {
      console.warn("Failed to log XP transaction (table might be missing):", e);
    }

    // 2. Update User Points & Coins
    await db.execute({
      sql: "UPDATE users SET points = points + ?, coins = coins + ? WHERE id = ?",
      args: [amount, coinsAmount, userId]
    });

    // 3. Fetch new totals
    const res = await db.execute({
      sql: "SELECT points, coins FROM users WHERE id = ?",
      args: [userId]
    });

    return NextResponse.json({ 
      success: true, 
      awarded: amount, 
      awardedCoins: coinsAmount,
      newTotal: res.rows[0]?.points,
      newCoins: res.rows[0]?.coins
    });
  } catch (error) {
    console.error("XP Award Error:", error);
    return NextResponse.json({ error: "Failed to award XP & Coins" }, { status: 500 });
  }
}
