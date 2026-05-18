import { db } from '../lib/turso';

async function run() {
  try {
    const res = await db.execute("SELECT id, name, email, role, avatar_image FROM users");
    console.log("=== USERS IN DATABASE ===");
    for (const row of res.rows) {
      const avatarStr = row.avatar_image as string;
      const avatarLen = avatarStr ? avatarStr.length : 0;
      const avatarPreview = avatarStr ? avatarStr.slice(0, 50) + "..." : "null";
      console.log(`ID: ${row.id} | Name: ${row.name} | Email: ${row.email} | Role: ${row.role} | Avatar Len: ${avatarLen} | Preview: ${avatarPreview}`);
    }
  } catch (e: any) {
    console.error("Error executing query:", e);
  }
}

run();
