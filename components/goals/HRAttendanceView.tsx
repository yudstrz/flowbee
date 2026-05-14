"use client";

import React, { useState, useEffect } from "react";
import HPCard from "@/components/ui/HPCard";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import HPGlyph from "@/components/ui/HPGlyph";
import HPAvatar from "@/components/ui/HPAvatar";
import AttendanceDashboard from "@/components/admin/AttendanceDashboard";

interface HRAttendanceViewProps {
  currentUser: any;
}

export default function HRAttendanceView({ currentUser }: HRAttendanceViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/logs?userId=${currentUser?.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.logs) setLogs(data.logs);

      // Fetch users if HR/Admin/Manager to compute absences
      if (['hr', 'manager'].includes(currentUser?.role)) {
        const uRes = await fetch(`/api/admin/users?adminId=${currentUser?.id}`);
        const uData = await uRes.json();
        if (uData.users) setUsers(uData.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      


      {/* Logs Table/List */}
      <div>
        {['hr', 'manager'].includes(currentUser?.role) && (
          <AttendanceDashboard logs={logs} users={users} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ ...HP_TEXT.h, fontSize: 15 }}>Log Absensi Terbaru</div>
          <button onClick={fetchLogs} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <HPGlyph name="refresh" size={14} color={HP_TOKENS.blue} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: HP_TOKENS.inkMute }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, border: `1.5px dashed ${HP_TOKENS.line}`, borderRadius: 20, color: HP_TOKENS.inkMute }}>
            Belum ada data absensi
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {logs.map((log: any) => (
              <HPCard key={log.id} padding={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <HPAvatar name={log.user_name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 14 }}>{log.user_name}</div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginTop: 2 }}>
                      {new Date(log.check_in_at).toLocaleString('id-ID')}
                      {log.check_in_type && ` • ${log.check_in_type}`}
                      {log.notes && ` • "${log.notes}"`}
                    </div>
                    {log.location_lat && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <HPGlyph name="target" size={10} color={HP_TOKENS.inkFade} />
                        <span style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkFade, fontSize: 9 }}>
                          {log.location_lat.toFixed(4)}, {log.location_lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 800, fontFamily: HP_FONT,
                    background: HP_TOKENS.sageSoft, color: HP_TOKENS.sage
                  }}>
                    {log.status.toUpperCase()}
                  </div>
                </div>
              </HPCard>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
