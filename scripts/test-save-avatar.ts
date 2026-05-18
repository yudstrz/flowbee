import { db } from '../lib/turso';

async function run() {
  const userId = "user_employee";
  const dummyBase64 = "data:image/jpeg;base64," + "A".repeat(5000); // 5KB dummy base64 string

  console.log("Attempting to save 5KB dummy avatar to database...");
  try {
    const res = await db.execute({
      sql: `UPDATE users SET avatar_image = ? WHERE id = ?`,
      args: [dummyBase64, userId]
    });
    console.log("Success! Database response:", res);

    const checkRes = await db.execute({
      sql: "SELECT avatar_image FROM users WHERE id = ?",
      args: [userId]
    });
    const saved = checkRes.rows[0]?.avatar_image as string;
    console.log("Saved length:", saved ? saved.length : 0);
    console.log("Saved preview:", saved ? saved.slice(0, 50) + "..." : "null");
  } catch (e: any) {
    console.error("FAILED to save avatar:", e);
  }
}

run();
