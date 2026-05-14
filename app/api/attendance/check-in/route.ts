import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export async function POST(request: Request) {
  try {
    const { userId, token, lat, lng, mood, checkInType = 'WFO', officeId, notes } = await request.json();

    if (!userId || !token) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (checkInType !== 'WFO' && !notes) {
      return NextResponse.json({ error: "Catatan/alasan wajib diisi untuk WFA atau Dinas" }, { status: 400 });
    }

    if (checkInType === 'WFO' && !officeId) {
      return NextResponse.json({ error: "Pilih lokasi kantor untuk check-in WFO" }, { status: 400 });
    }

    // 1. Verify Token
    if (token !== 'manual_checkin') {
      console.log(`[Attendance] Verifying token for user ${userId}: ${token.substring(0, 8)}...`);
      const tokenCheck = await db.execute({
        sql: "SELECT expires_at FROM attendance_tokens WHERE token = ?",
        args: [token]
      });

      if (tokenCheck.rows.length === 0) {
        console.warn(`[Attendance] Invalid token attempt: ${token}`);
        return NextResponse.json({ error: "QR Code tidak valid atau sudah kadaluarsa" }, { status: 400 });
      }

      const expiresAt = new Date(tokenCheck.rows[0].expires_at as string);
      if (expiresAt < new Date()) {
        console.warn(`[Attendance] Token expired: ${token}`);
        return NextResponse.json({ error: "QR Code sudah kadaluarsa" }, { status: 400 });
      }
    } else {
      console.log(`[Attendance] Manual check-in for user ${userId}`);
    }

    // 2. Verify Location (Geofencing) only for WFO if coordinates provided
    if (checkInType === 'WFO' && lat && lng) {
      console.log(`[Attendance] Verifying location for WFO at office ${officeId}`);
      const officeCheck = await db.execute({
        sql: "SELECT lat, lng, radius FROM office_locations WHERE id = ?",
        args: [officeId]
      });

      if (officeCheck.rows.length > 0) {
        const office = officeCheck.rows[0] as unknown as { lat: number, lng: number, radius: number };
        const distance = calculateDistance(lat, lng, office.lat, office.lng);
        console.log(`[Attendance] Distance check: ${Math.round(distance)}m from office (max ${office.radius}m)`);
        if (distance > office.radius) {
          return NextResponse.json({ error: `Anda berada di luar area kantor. Jarak Anda: ${Math.round(distance)}m, Maksimal: ${office.radius}m` }, { status: 403 });
        }
      }
    }

    // 3. Record Attendance
    console.log(`[Attendance] Recording attendance for user ${userId} (${checkInType})`);
    const id = "att_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    await db.execute({
      sql: "INSERT INTO attendance (id, user_id, location_lat, location_lng, mood, check_in_type, office_id, notes, check_in_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, userId, lat || null, lng || null, mood || null, checkInType, officeId || null, notes || null, now]
    });

    // 4. Delete Token (Single Use)
    if (token !== 'manual_checkin') {
      await db.execute({
        sql: "DELETE FROM attendance_tokens WHERE token = ?",
        args: [token]
      });
    }

    console.log(`[Attendance] Check-in successful for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Check-in Error:", error);
    return NextResponse.json({ error: "Gagal check-in" }, { status: 500 });
  }
}
