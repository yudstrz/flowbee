"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import Modal from "@/components/ui/Modal";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import { useHP } from "@/lib/HPContext";
import HPGlyph from "@/components/ui/HPGlyph";

interface AttendanceScannerModalProps {
  onClose: () => void;
}

export default function AttendanceScannerModal({ onClose }: AttendanceScannerModalProps) {
  const { user, awardXP } = useHP();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [checkInType, setCheckInType] = useState('WFO');
  const [officeId, setOfficeId] = useState('');
  const [notes, setNotes] = useState('');
  const [offices, setOffices] = useState<any[]>([]);
  
  useEffect(() => {
    // Get location immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.warn("Location error:", err);
          setErrorMsg("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
        }
      );
    }
    
    // Fetch offices
    fetch("/api/settings/office").then(res => res.json()).then(data => {
      if (data.offices) {
        setOffices(data.offices);
        if (data.offices.length > 0) setOfficeId(data.offices[0].id);
      }
    }).catch(e => console.error(e));
  }, []);

  const handleCheckIn = async () => {
    setStatus('verifying');
    
    // Add a timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          token: "manual_checkin", // Using a dummy token for manual checkin
          lat: location?.lat,
          lng: location?.lng,
          checkInType,
          officeId,
          notes
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        awardXP('priority_complete', 'Check-in kantor tepat waktu! 🏢');
        setTimeout(onClose, 2000);
      } else {
        setStatus('error');
        setErrorMsg(data.error || "Gagal check-in");
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      setStatus('error');
      if (e.name === 'AbortError') {
        setErrorMsg("Waktu verifikasi habis (Timeout). Cek koneksi internet kamu.");
      } else {
        setErrorMsg("Terjadi kesalahan koneksi atau sistem.");
      }
      console.error("Check-in catch:", e);
    }
  };

  return (
    <Modal onClose={onClose} title="Attendance Check-in">
      <div style={{ padding: '10px 0' }}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ ...HP_TEXT.h, fontSize: 18 }}>Berhasil Check-in!</div>
            <div style={{ ...HP_TEXT.small, color: HP_TOKENS.sage, fontWeight: 800, marginTop: 8 }}>+50 XP Awarded 🎁</div>
          </div>
        ) : (
          <>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', marginBottom: 24 }}>
              <div>
                <label style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700 }}>Tipe Kehadiran</label>
                <select 
                  value={checkInType} onChange={e => setCheckInType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 12, border: `1px solid ${HP_TOKENS.line}`, fontFamily: HP_FONT, outline: 'none', background: '#fff' }}
                >
                  <option value="WFO">Work From Office</option>
                  <option value="WFA">Work From Anywhere</option>
                  <option value="DINAS">Perjalanan Dinas</option>
                </select>
              </div>

              {checkInType === 'WFO' && (
                <div>
                  <label style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700 }}>Lokasi Kantor</label>
                  <select 
                    value={officeId} onChange={e => setOfficeId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 12, border: `1px solid ${HP_TOKENS.line}`, fontFamily: HP_FONT, outline: 'none', background: '#fff' }}
                  >
                    {offices.map(off => (
                      <option key={off.id} value={off.id}>{off.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {checkInType !== 'WFO' && (
                <div>
                  <label style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700 }}>Catatan/Alasan</label>
                  <input 
                    type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Misal: Bekerja dari cafe..."
                    style={{ width: '100%', padding: '10px', borderRadius: 12, border: `1px solid ${HP_TOKENS.line}`, fontFamily: HP_FONT, outline: 'none' }}
                  />
                </div>
              )}
            </div>

            {status === 'verifying' && (
              <div style={{ 
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, border: `3px solid ${HP_TOKENS.line}`,
                  borderTopColor: HP_TOKENS.blue, borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <div style={{ ...HP_TEXT.h, fontSize: 14 }}>Memverifikasi...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {status === 'error' && (
              <div style={{ 
                marginBottom: 16, padding: 12, borderRadius: 12, background: HP_TOKENS.coralSoft, 
                color: HP_TOKENS.coral, fontSize: 13, fontWeight: 700, textAlign: 'center'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {status !== 'verifying' && (
                <button onClick={handleCheckIn} style={{
                  width: '100%', padding: '16px', borderRadius: 99,
                  background: HP_TOKENS.blue, color: '#fff', border: 'none',
                  fontFamily: HP_FONT, fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }} className="hp-tap">
                  <HPGlyph name="target" size={18} color="#fff" />
                  Check-in Sekarang
                </button>
              )}
              
              <button onClick={onClose} style={{
                width: '100%', padding: '16px', borderRadius: 99,
                background: HP_TOKENS.lineSoft, color: HP_TOKENS.ink, border: 'none',
                fontFamily: HP_FONT, fontWeight: 800, fontSize: 15, cursor: 'pointer'
              }}>
                Batal
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
