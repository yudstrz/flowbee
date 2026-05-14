"use client";

import React, { useState } from "react";
import { useHP } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import {
  MANAGER_TEAM_MEMBERS,
  MANAGER_APPROVAL_TASKS,
  MANAGER_ONE_ON_ONES,
} from "@/lib/mockData";
import HPGlyph from "@/components/ui/HPGlyph";
import HPCard from "@/components/ui/HPCard";
import HPAvatar from "@/components/ui/HPAvatar";
import SectionHeader from "@/components/home/SectionHeader";
import BlobBackground from "@/components/home/BlobBackground";
import BeeMascot from "@/components/ui/BeeMascot";

interface Props { openModal: (name: string, props?: any) => void; }

const MOOD_COLOR: Record<string, string> = {
  joy: HP_TOKENS.yellow,
  calm: HP_TOKENS.sage,
  tired: HP_TOKENS.coral,
  stress: '#E85C7A',
  neutral: HP_TOKENS.inkMute,
};

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  status: string;
  wellbeing: number;
  statusTone: string;
  glyph?: string;
  tasks: { done: number; total: number };
}

interface ApprovalTask {
  id: number | string;
  type: string;
  from: string;
  desc: string;
  urgent?: boolean;
}

interface OneOnOneSession {
  id: number | string;
  with: string;
  date: string;
  time: string;
  topic: string;
  urgent?: boolean;
  meetLink?: string;
}

export default function ManagerHomeScreen({ openModal }: Props) {
  const { state, user, awardXP } = useHP();
  const managerData = state?.managerData || { members: [], goals: [], approvals: [] };
  const { members, goals, approvals: serverApprovals } = managerData;
  const [localApprovals, setLocalApprovals] = useState<ApprovalTask[] | null>(null);

  const currentApprovals = localApprovals || serverApprovals || [];
  const teamAtRisk = members.filter((m: TeamMember) => m.status === 'Needs check-in' || m.status === 'At risk');
  const avgWellbeing = members.length > 0 ? Math.round(members.reduce((a: number, b: TeamMember) => a + b.wellbeing, 0) / members.length) : 0;

  const handleApprove = async (id: number | string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/admin/approve-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: id, status: 'approved', adminId: user.id })
      });
      if (res.ok) {
        setLocalApprovals(currentApprovals.filter((a: any) => a.id !== id));
        awardXP('approve_goal', 'Menyetujui target KPI anggota tim');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user || !state) return null;

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 120, fontFamily: HP_FONT }}>
      <BlobBackground colors={[HP_TOKENS.blueWash, HP_TOKENS.yellowWash, HP_TOKENS.blueSoft]} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 16px' }} className="hp-stagger">

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${HP_TOKENS.paper}, #fff)`,
          borderRadius: 24, padding: '24px 20px', marginTop: 8,
          border: `1.5px solid ${HP_TOKENS.line}`, boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 100, fontWeight: 900, color: HP_TOKENS.lineSoft, zIndex: 0, opacity: 0.4 }}>
            {user.level}
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div 
                className="hp-tap"
                onClick={() => openModal('profile_editor')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                <HPAvatar name={user.name} size={52} rank={user.rank} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 20 }}>{user.name.split(' ')[0]}</div>
                    <div style={{ background: HP_TOKENS.blue, color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6 }}>
                      MANAGER
                    </div>
                  </div>
                  <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, marginTop: 2 }}>
                    {user.role} · {members.length} anggota tim
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => openModal('system_guide')} className="hp-tap" style={{
                  background: HP_TOKENS.lineSoft, border: 'none', borderRadius: 20, width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                  <HPGlyph name="sparkle" size={16} color={HP_TOKENS.blue} />
                </button>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 99,
                  background: HP_TOKENS.blueSoft, fontFamily: HP_FONT, fontWeight: 900, fontSize: 14, color: HP_TOKENS.blue,
                }}>
                  🔥 <span>{user.streak}</span>
                </div>
              </div>
            </div>

            {/* Team health bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Wellbeing Tim', value: `${avgWellbeing}`, suffix: '/100', color: HP_TOKENS.sage, icon: '🌱' },
                { label: 'Approval', value: `${currentApprovals.length}`, suffix: ' pending', color: currentApprovals.length > 0 ? HP_TOKENS.coral : HP_TOKENS.sage, icon: '⏳' },
                { label: 'At Risk', value: `${teamAtRisk.length}`, suffix: ' org', color: teamAtRisk.length > 0 ? HP_TOKENS.coral : HP_TOKENS.sage, icon: '⚠️' },
              ].map(s => (
                <div key={s.label} style={{
                  background: HP_TOKENS.lineSoft, borderRadius: 16, padding: '12px 10px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: HP_FONT, fontWeight: 900, fontSize: 20, color: s.color }}>
                    {s.value}<span style={{ fontSize: 10, color: HP_TOKENS.inkMute }}>{s.suffix}</span>
                  </div>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Check-in Button */}
        <button 
          onClick={() => openModal('attendance_scanner')}
          style={{
            marginTop: 16, width: '100%', padding: '14px', borderRadius: 20, 
            background: HP_TOKENS.ink, color: '#fff',
            border: 'none', fontFamily: HP_FONT, fontWeight: 800, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }} className="hp-tap"
        >
          <HPGlyph name="target" size={18} color="#fff" />
          Check-in Office
        </button>

        <div style={{ marginTop: 16 }}>
          <SectionHeader icon="people" label="Status Tim Hari Ini" count={`${members.length} orang`} action="Lihat semua" onAction={() => {}} />
          <HPCard padding={14}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {members.map((m: TeamMember, i: number) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${HP_TOKENS.lineSoft}`,
                }}>
                  <HPAvatar name={m.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 13 }}>{m.name}</div>
                    <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontSize: 11 }}>{m.role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* task progress */}
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>
                      {m.tasks.done}/{m.tasks.total}
                    </div>
                    {/* mood */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HPGlyph name={m.glyph || 'check'} size={18} color={HP_TOKENS.ink} />
          </div>
                    {/* status badge */}
                    <div style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 8, fontFamily: HP_FONT,
                      background: m.statusTone === 'sage' ? HP_TOKENS.sageSoft : m.statusTone === 'yellow' ? HP_TOKENS.yellowSoft : HP_TOKENS.coralSoft,
                      color: m.statusTone === 'sage' ? HP_TOKENS.sage : m.statusTone === 'yellow' ? '#8A6814' : HP_TOKENS.coral,
                    }}>
                      {m.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </HPCard>
        </div>

        {/* Approvals */}
        {currentApprovals.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <SectionHeader icon="target" label="Perlu Approval" count={String(currentApprovals.length)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentApprovals.map((task: any) => (
                <HPCard key={task.id} padding={14} style={{ border: task.urgent ? `1.5px solid ${HP_TOKENS.coral}` : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                      background: task.urgent ? HP_TOKENS.coralSoft : HP_TOKENS.blueSoft,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <HPGlyph name={task.urgent ? 'leaf' : 'calendar'} size={18} color={task.urgent ? HP_TOKENS.coral : HP_TOKENS.blue} />
                    </div>
                    <div style={{ flex: 1 }}>
                      {task.urgent && (
                        <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.coral, marginBottom: 2 }}>URGENT</div>
                      )}
                      <div style={{ ...HP_TEXT.h, fontSize: 13 }}>{task.type} · {task.from}</div>
                      <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkSoft, marginTop: 2 }}>{task.desc}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleApprove(task.id)} className="hp-tap" style={{
                        padding: '6px 12px', borderRadius: 10, border: 'none', background: HP_TOKENS.sage,
                        color: '#fff', fontFamily: HP_FONT, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                      }}>Setuju</button>
                      <button className="hp-tap" style={{
                        padding: '6px 10px', borderRadius: 10, border: `1px solid ${HP_TOKENS.line}`,
                        background: 'transparent', fontFamily: HP_FONT, fontWeight: 700, fontSize: 12, cursor: 'pointer', color: HP_TOKENS.inkSoft
                      }}>Tunda</button>
                    </div>
                  </div>
                </HPCard>
              ))}
            </div>
          </div>
        )}



        {/* Surveys Section */}
        {state.surveys && state.surveys.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <SectionHeader 
              icon="book" 
              label="Survey untuk kamu" 
              count={String(state.surveys.length)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {state.surveys.map((sr: any) => (
                <HPCard 
                  key={sr.id} 
                  padding={16} 
                  onClick={() => {
                    window.open(sr.url, '_blank');
                    awardXP('survey_complete', `Selesaikan survey: ${sr.title}`);
                  }}
                  style={{ cursor: 'pointer', border: `1.5px solid ${HP_TOKENS.blue}40` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: HP_TOKENS.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HPGlyph name="book" size={22} color={HP_TOKENS.blue} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...HP_TEXT.h, fontSize: 15 }}>{sr.title}</div>
                      <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkSoft, fontWeight: 600, marginTop: 2 }}>
                        Klik untuk isi survey
                      </div>
                    </div>
                    <HPGlyph name="arrow" size={18} color={HP_TOKENS.inkMute}/>
                  </div>
                </HPCard>
              ))}
            </div>
          </div>
        )}

        {/* AI Coach for Manager - with Bee Mascot */}
        <div style={{ 
          marginTop: 16, 
          background: `linear-gradient(135deg, ${HP_TOKENS.blue}, #2B5286)`, 
          borderRadius: 22,
          padding: '16px 20px',
          boxShadow: '0 8px 22px rgba(59,111,160,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 20
        }} onClick={() => openModal('coach')} className="hp-tap">
          <BeeMascot mood="happy" size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ ...HP_TEXT.h, fontSize: 15, color: '#fff' }}>AI Manager Coach</div>
            <div style={{ ...HP_TEXT.small, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Feedback, coaching & pengelolaan tim
            </div>
          </div>
          <HPGlyph name="arrow" size={18} color="#fff" />
        </div>
      </div>
    </div>
  );
}
