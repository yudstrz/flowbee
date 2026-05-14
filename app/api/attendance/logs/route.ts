import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required" }, { status: 400 });
    }

    // Check role
    const userCheck = await db.execute({
      sql: "SELECT role FROM users WHERE id = ?",
      args: [userId]
    });
    const role = userCheck.rows[0]?.role;

    let query = "";
    let args: any[] = [];

    if (role === 'hr' || role === 'manager') {
      // HR, Admin, and Manager see EVERYONE
      query = `
        SELECT a.*, u.name as user_name, u.email as user_email 
        FROM attendance a 
        JOIN users u ON a.user_id = u.id 
        ORDER BY a.check_in_at DESC
      `;
      args = [];
    } else {
      // Regular employees see only THEIR OWN logs
      query = `
        SELECT a.*, u.name as user_name, u.email as user_email 
        FROM attendance a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.user_id = ?
        ORDER BY a.check_in_at DESC
      `;
      args = [userId];
    }

    const res = await db.execute({ sql: query, args });
    return NextResponse.json(
      { logs: res.rows },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error("Attendance Logs Error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
