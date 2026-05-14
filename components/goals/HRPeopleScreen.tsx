"use client";

import React, { useState } from "react";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import { HR_ALL_EMPLOYEES, HR_ORG_GOALS, HR_DEPT_PULSE } from "@/lib/mockData";
import HPGlyph from "@/components/ui/HPGlyph";
import HPCard from "@/components/ui/HPCard";
import HPBar from "@/components/ui/HPBar";
import HPAvatar from "@/components/ui/HPAvatar";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionHeader from "@/components/home/SectionHeader";

interface Props { openModal: (name: string, props?: any) => void; }

const TONE_COLOR: Record<string, string> = {
  sage: HP_TOKENS.sage, blue: HP_TOKENS.blue,
  yellow: '#8A6814', coral: HP_TOKENS.coral, lavender: HP_TOKENS.lavender,
};
const TONE_SOFT: Record<string, string> = {
  sage: HP_TOKENS.sageSoft, blue: HP_TOKENS.blueSoft,
  yellow: HP_TOKENS.yellowSoft, coral: HP_TOKENS.coralSoft, lavender: HP_TOKENS.lavenderSoft,
};

import { useHP } from "@/lib/HPContext";
import { useEffect } from "react";
import HRAttendanceView from "@/components/goals/HRAttendanceView";
import OfficeSettingsMap from "@/components/admin/OfficeSettingsMap";

export default function HRPeopleScreen({ openModal }: Props) {
  const { state, user: currentUser, updateState, refreshSurveys } = useHP();
  const isHR = currentUser?.role === 'hr';
  const [activeTab, setActiveTab] = useState<'goals' | 'people' | 'dept' | 'surveys' | 'users' | 'attendance' | 'office' | 'schedule' | 'contacts'>(isHR ? 'users' : 'attendance');
  const [search, setSearch] = useState('');
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (activeTab === 'users' && isHR) {
      fetchUsers();
    }
    if (activeTab === 'surveys') {
      refreshSurveys();
    }
  }, [activeTab, isHR, refreshSurveys]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?adminId=${currentUser?.id}`);
      const data = await res.json();
      if (data.users) setDbUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUser = async (targetUserId: string, updates: { newRole?: string, managerId?: string, jobTitle?: string, department?: string }) => {
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser?.id,
          targetUserId,
          ...updates
        }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser?.id,
          targetUserId
        }),
      });
      if (res.ok) fetchUsers();
      else alert("Gagal menghapus user. Pastikan Anda memiliki akses admin.");
    } catch (e) {
      console.error(e);
    }
  };

  const managers = dbUsers.filter(u => u.role === 'manager');

  const filtered = dbUsers.filter(e =>
    (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateUser = async (formData: any) => {
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId: currentUser?.id,
        ...formData
      }),
    });
    if (res.ok) fetchUsers();
    else {
      const err = await res.json();
      throw new Error(err.error || "Gagal");
    }
  };

  return (
    <div style={{ padding: '0 16px 120px', fontFamily: HP_FONT }}>
      <ScreenHeader 
        title={isHR ? "Management Console" : "People"} 
        subtitle={isHR ? "Kelola karyawan, role & pelaporan" : "Kelola karyawan & organisasi"} 
      />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          isHR && { key: 'users', label: 'Users & Roles' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'office', label: 'Office' },
          { key: 'schedule', label: 'Work Hours' },
          { key: 'contacts', label: 'Contacts' },
          { key: 'people',  label: 'Directory' },
          { key: 'surveys', label: 'Surveys' },
        ].filter(Boolean).map((t: any) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className="hp-tap" style={{
            flex: '0 0 auto', padding: '10px 16px', borderRadius: 14,
            background: activeTab === t.key ? HP_TOKENS.lavender : HP_TOKENS.lineSoft,
            color: activeTab === t.key ? '#fff' : HP_TOKENS.inkSoft,
            border: 'none', fontFamily: HP_FONT, fontWeight: 800, fontSize: 11, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Users (HR/Admin) ── */}
      {activeTab === 'users' && isHR && (
        <>
          <SectionHeader 
            icon="people" 
            label="Daftar Seluruh User" 
            count={String(dbUsers.length)} 
            action="+ Tambah Akun"
            onAction={() => openModal('create_user', { onSave: handleCreateUser })}
          />
          
          {/* Search & Actions Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              background: HP_TOKENS.paper, borderRadius: 16, padding: '12px 16px',
              border: `1.5px solid ${HP_TOKENS.line}`
            }}>
              <HPGlyph name="leaf" size={18} color={HP_TOKENS.blue} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau departemen..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: HP_FONT, fontWeight: 700, fontSize: 14, color: HP_TOKENS.ink,
                }}
              />
            </div>
            <button 
              onClick={() => openModal('manage_depts')}
              className="hp-tap"
              style={{
                padding: '0 16px', borderRadius: 16, background: HP_TOKENS.paper,
                border: `1.5px solid ${HP_TOKENS.line}`, color: HP_TOKENS.ink,
                fontFamily: HP_FONT, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <HPGlyph name="book" size={16} color={HP_TOKENS.blue} />
              Kategori
            </button>
          </div>

          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: 40, color: HP_TOKENS.inkMute }}>Loading users...</div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(u => (
              <HPCard 
                key={u.id} 
                padding={12} 
                onClick={() => openModal('edit_user', {
                  user: u,
                  managers: managers,
                  onSave: (updates: any) => handleUpdateUser(u.id, updates),
                  onDelete: () => handleDeleteUser(u.id)
                })}
                style={{ cursor: 'pointer', border: `1.5px solid ${HP_TOKENS.line}` }}
                className="hp-tap"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <HPAvatar name={u.name} size={44} image={u.avatar_image} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ ...HP_TEXT.h, fontSize: 15 }}>{u.name}</div>
                      <div style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900,
                        background: u.role === 'hr' ? '#EDE8F5' : u.role === 'manager' ? HP_TOKENS.blueSoft : HP_TOKENS.yellowSoft,
                        color: u.role === 'hr' ? '#7B6BB5' : u.role === 'manager' ? HP_TOKENS.blue : HP_TOKENS.yellow,
                      }}>
                        {u.role.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700, marginTop: 2 }}>
                      {u.job_title || 'No Title'} • {u.department || 'No Dept'}
                    </div>
                  </div>
                  <HPGlyph name="arrow" size={16} color={HP_TOKENS.line} />
                </div>
              </HPCard>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: HP_TOKENS.inkMute }}>
                Tidak menemukan user dengan kata kunci "{search}"
              </div>
            )}
          </div>
          )}
        </>
      )}

      {/* ── Attendance ── */}
      {activeTab === 'attendance' && (
        <HRAttendanceView currentUser={currentUser} />
      )}

      {/* ── Office Settings ── */}
      {activeTab === 'office' && (
        <OfficeSettingsMap />
      )}

      {/* ── Surveys ── */}
      {activeTab === 'surveys' && (
        <>
          <HPCard style={{ background: HP_TOKENS.blueSoft, border: 'none', marginBottom: 14 }} padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: HP_TOKENS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HPGlyph name="book" size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...HP_TEXT.h, fontSize: 14, color: HP_TOKENS.blue }}>Engagement Surveys</div>
                <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkSoft, fontWeight: 600, marginTop: 2 }}>
                  Kirim survey ke seluruh karyawan
                </div>
              </div>
            </div>
          </HPCard>

          <SectionHeader 
            icon="book" 
            label="Active Surveys" 
            count={String(state?.surveys?.length || 0)} 
            action="Manage" 
            onAction={() => openModal('manage_surveys')} 
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {state?.surveys?.map((sr: any) => (
              <HPCard key={sr.id} padding={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: HP_TOKENS.lineSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HPGlyph name="target" size={20} color={HP_TOKENS.inkMute} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 14 }}>{sr.title}</div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginTop: 2 }}>
                      Diterbitkan pada {new Date(sr.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      onClick={() => openModal('manage_surveys', { editId: sr.id })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      className="hp-tap"
                    >
                      <HPGlyph name="sparkle" size={16} color={HP_TOKENS.blue}/>
                    </button>
                    <div style={{
                      padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 800, fontFamily: HP_FONT,
                      background: HP_TOKENS.sageSoft, color: HP_TOKENS.sage
                    }}>
                      ACTIVE
                    </div>
                  </div>
                </div>
              </HPCard>
            ))}
            {(!state?.surveys || state.surveys.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: HP_TOKENS.inkMute, border: `1.5px dashed ${HP_TOKENS.line}`, borderRadius: 20 }}>
                Belum ada survey yang dibuat.
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Work Hours Settings ── */}
      {activeTab === 'schedule' && (
        <>
          <HPCard style={{ background: HP_TOKENS.sageSoft, border: 'none', marginBottom: 16 }} padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: HP_TOKENS.sage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HPGlyph name="calendar" size={24} color="#fff" />
              </div>
              <div>
                <div style={{ ...HP_TEXT.h, fontSize: 16 }}>Jam Kerja Organisasi</div>
                <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkSoft }}>Set jam operasional & waktu istirahat</div>
              </div>
            </div>
          </HPCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HPCard padding={16}>
              <div style={{ ...HP_TEXT.h, fontSize: 14, marginBottom: 16 }}>Jam Operasional</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 6 }}>JAM MULAI</div>
                  <input 
                    type="time" 
                    value={state?.workSchedule?.start || "08:00"}
                    onChange={(e) => updateState({ workSchedule: { start: e.target.value, end: state?.workSchedule?.end ?? '17:00', breakStart: state?.workSchedule?.breakStart ?? '12:00', breakEnd: state?.workSchedule?.breakEnd ?? '13:00' } })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 6 }}>JAM SELESAI</div>
                  <input 
                    type="time" 
                    value={state?.workSchedule?.end || "17:00"}
                    onChange={(e) => updateState({ workSchedule: { start: state?.workSchedule?.start ?? '08:00', end: e.target.value, breakStart: state?.workSchedule?.breakStart ?? '12:00', breakEnd: state?.workSchedule?.breakEnd ?? '13:00' } })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </HPCard>

            <HPCard padding={16}>
              <div style={{ ...HP_TEXT.h, fontSize: 14, marginBottom: 16 }}>Waktu Istirahat</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 6 }}>MULAI ISTIRAHAT</div>
                  <input 
                    type="time" 
                    value={state?.workSchedule?.breakStart || "12:00"}
                    onChange={(e) => updateState({ workSchedule: { start: state?.workSchedule?.start ?? '08:00', end: state?.workSchedule?.end ?? '17:00', breakStart: e.target.value, breakEnd: state?.workSchedule?.breakEnd ?? '13:00' } })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 6 }}>SELESAI ISTIRAHAT</div>
                  <input 
                    type="time" 
                    value={state?.workSchedule?.breakEnd || "13:00"}
                    onChange={(e) => updateState({ workSchedule: { start: state?.workSchedule?.start ?? '08:00', end: state?.workSchedule?.end ?? '17:00', breakStart: state?.workSchedule?.breakStart ?? '12:00', breakEnd: e.target.value } })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </HPCard>
          </div>
          
          <div style={{ marginTop: 20, padding: 16, borderRadius: 14, background: HP_TOKENS.paper, border: `1px solid ${HP_TOKENS.line}` }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <HPGlyph name="sparkle" size={18} color={HP_TOKENS.sage} />
              <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkSoft }}>
                Pengaturan ini akan muncul di dashboard setiap karyawan untuk membantu mereka mengatur ritme kerja & istirahat.
              </div>
            </div>
          </div>
        </>
      )}


      {/* ── Contacts Management ── */}
      {activeTab === 'contacts' && (
        <>
          <SectionHeader icon="phone" label="Kontak Organisasi" action="+ Tambah" onAction={() => {
            openModal('contact_editor', {
              onSave: (newContact: any) => {
                updateState({ contacts: [...(state?.contacts || []), newContact] });
              }
            });
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(state?.contacts || []).map(contact => (
              <HPCard key={contact.id} padding={14}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: HP_TOKENS.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HPGlyph name="people" size={20} color={HP_TOKENS.blue} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 14 }}>{contact.name}</div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>{contact.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...HP_TEXT.small, fontWeight: 700 }}>{contact.phone}</div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.blue }}>{contact.email}</div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm("Hapus kontak ini?")) {
                        updateState({ contacts: (state?.contacts || []).filter(c => c.id !== contact.id) });
                      }
                    }}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
                  >
                    <HPGlyph name="close" size={16} color={HP_TOKENS.coral} />
                  </button>
                </div>
              </HPCard>
            ))}
          </div>
        </>
      )}

      {/* ── People ── */}
      {activeTab === 'people' && (
        <>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: HP_TOKENS.lineSoft, borderRadius: 14, padding: '10px 14px', marginBottom: 12,
          }}>
            <HPGlyph name="leaf" size={16} color={HP_TOKENS.inkMute} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari karyawan atau departemen..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontFamily: HP_FONT, fontWeight: 600, fontSize: 14, color: HP_TOKENS.ink,
              }}
            />
          </div>

          {/* Stats summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Total', value: dbUsers.length, color: HP_TOKENS.lavender },
              { label: 'Excellent', value: dbUsers.filter(e => (e.points || 0) >= 1000).length, color: HP_TOKENS.sage },
              { label: 'Level 10+', value: dbUsers.filter(e => (e.level || 0) >= 10).length, color: HP_TOKENS.blue },
            ].map(s => (
              <div key={s.label} style={{
                background: HP_TOKENS.lineSoft, borderRadius: 12, padding: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: HP_FONT, fontWeight: 900, fontSize: 22, color: s.color }}>{s.value}</div>
                <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(e => (
              <HPCard key={e.id} padding={12} style={{ border: e.risk === 'high' ? `1.5px solid ${HP_TOKENS.coral}40` : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HPAvatar name={e.name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ ...HP_TEXT.h, fontSize: 13 }}>{e.name}</div>
                      <div style={{ fontSize: 14 }}>{e.mood || "✨"}</div>
                    </div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>{e.job_title || "Team Member"} · {e.department || "Organization"}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.sage }}>Lvl {e.level || 1}</div>
                      <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.blue }}>{e.points || 0} XP</div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 800, fontFamily: HP_FONT,
                    background: HP_TOKENS.lineSoft,
                    color: HP_TOKENS.inkSoft,
                  }}>
                    ACTIVE
                  </div>
                </div>
              </HPCard>
            ))}
          </div>
        </>
      )}


    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', marginTop: 8, padding: 12, borderRadius: 12,
  border: `1.5px solid ${HP_TOKENS.line}`, fontFamily: HP_FONT, fontSize: 14,
  outline: 'none', background: '#fff', color: HP_TOKENS.ink,
  boxSizing: 'border-box',
};
