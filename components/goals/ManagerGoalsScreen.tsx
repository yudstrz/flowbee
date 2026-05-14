"use client";

import React, { useState } from "react";
import { useHP } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import {
  MANAGER_TEAM_GOALS,
  MANAGER_TEAM_MEMBERS,
  MANAGER_ONE_ON_ONES,
} from "@/lib/mockData";
import HPGlyph from "@/components/ui/HPGlyph";
import HPCard from "@/components/ui/HPCard";
import HPBar from "@/components/ui/HPBar";
import HPAvatar from "@/components/ui/HPAvatar";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionHeader from "@/components/home/SectionHeader";

import HRAttendanceView from "@/components/goals/HRAttendanceView";
import GoalCard from "@/components/goals/GoalCard";

interface Props { openModal: (name: string, props?: any) => void; }

const TONE: Record<string, string> = { sage: HP_TOKENS.sage, blue: HP_TOKENS.blue, lavender: HP_TOKENS.lavender, yellow: HP_TOKENS.yellow, coral: HP_TOKENS.coral };
const TONE_SOFT: Record<string, string> = { sage: HP_TOKENS.sageSoft, blue: HP_TOKENS.blueSoft, lavender: HP_TOKENS.lavenderSoft, yellow: HP_TOKENS.yellowSoft, coral: HP_TOKENS.coralSoft };

export default function ManagerGoalsScreen({ openModal }: Props) {
  const { state, user, updateState } = useHP();
  const [activeTab, setActiveTab] = useState<'okr' | 'members' | 'attendance' | 'personal'>('okr');

  if (!state || !user) return null;

  // Filter for goals relevant to the manager
  const assignedGoals = state.goals.filter((g: any) => g.scope === 'assigned' && String(g.assignedById) === String(user.id));
  const teamTasks = state.managerData?.teamTasks || [];
  const personalTasks = state.priorities || [];

  const handleVerifyTask = async (taskId: string, goalId: string) => {
    try {
      // 1. Call API
      const res = await fetch("/api/manager/verify-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, goalId, managerId: user.id })
      });

      if (!res.ok) throw new Error("Failed to verify");

      // 2. Update local state
      updateState((s: any) => {
        const newTeamTasks = s.managerData?.teamTasks?.map((t: any) => 
          t.id === taskId ? { ...t, verified: true, done: true } : t
        ) || [];
        
        const tasksForGoal = newTeamTasks.filter((t: any) => String(t.goalId) === String(goalId));
        const verifiedCount = tasksForGoal.filter((t: any) => t.verified).length;
        const newProgress = tasksForGoal.length > 0 
          ? Math.round((verifiedCount / tasksForGoal.length) * 100) 
          : 0;

        const newGoals = s.goals.map((g: any) => 
          String(g.id) === String(goalId) 
            ? { ...g, progress: newProgress, metric: `${verifiedCount}/${tasksForGoal.length} verified` } 
            : g
        );

        return {
          ...s,
          goals: newGoals,
          managerData: {
            ...s.managerData,
            teamTasks: newTeamTasks
          }
        };
      });
    } catch (e) {
      console.error(e);
      alert("Gagal memverifikasi tugas.");
    }
  };

  return (
    <div style={{ padding: '0 16px 120px', fontFamily: HP_FONT }}>
      <ScreenHeader title="Tim & OKR" subtitle="Pantau goal tim dan performa anggota" />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {([
          { key: 'okr', label: 'OKR Tim' },
          { key: 'personal', label: 'Personal' },
          { key: 'members', label: 'Anggota' },
          { key: 'attendance', label: 'Absensi' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className="hp-tap" style={{
            flex: '0 0 auto', padding: '10px 16px', borderRadius: 14,
            background: activeTab === t.key ? HP_TOKENS.blue : HP_TOKENS.lineSoft,
            color: activeTab === t.key ? '#fff' : HP_TOKENS.inkSoft,
            border: 'none', fontFamily: HP_FONT, fontWeight: 800, fontSize: 11, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OKR Tim ── */}
      {activeTab === 'okr' && (
        <>
          {/* Assigned OKRs (KPIs) */}
          <SectionHeader 
            icon="people" 
            label="Assigned to Members (KPIs)" 
            count={String(assignedGoals.length)} 
            action="+ Buat KPI"
            onAction={() => openModal('new_goal', { scope: 'employee' })}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assignedGoals.map(g => {
              const tasksForGoal = teamTasks.filter((t: any) => t.goalId && String(t.goalId) === String(g.id)) || [];
              const isPending = g.status === 'pending';
              const ownerName = g.owner || state.managerData?.members?.find((m: any) => String(m.id) === String(g.ownerId))?.name || 'You';
              
              return (
                <div key={g.id}>
                  <div style={{ 
                    padding: '6px 12px', background: isPending ? HP_TOKENS.yellowWash : g.status === 'approved' ? HP_TOKENS.sageWash : HP_TOKENS.coralWash, 
                    borderRadius: '16px 16px 0 0', 
                    fontSize: 10, fontWeight: 900, color: isPending ? '#8A6814' : g.status === 'approved' ? HP_TOKENS.sage : HP_TOKENS.coral, 
                    border: `1px solid ${HP_TOKENS.line}`,
                    borderBottom: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>ASSIGNED TO: {ownerName.toUpperCase()}</span>
                    <span style={{ textTransform: 'uppercase' }}>{g.status === 'pending' ? 'ON PROGRESS' : (g.status || 'ON PROGRESS')}</span>
                  </div>
                  <HPCard padding={0} style={{ borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                    <div onClick={() => openModal('new_goal', { goal: g })} className="hp-tap">
                      <GoalCard g={g} />
                    </div>
                    
                    {/* KPI Review Section */}
                    <div style={{ padding: '12px 16px', background: HP_TOKENS.paper, borderTop: `1px solid ${HP_TOKENS.line}` }}>
                      <div style={{ ...HP_TEXT.tiny, fontWeight: 900, color: HP_TOKENS.inkMute, marginBottom: 12 }}>EVIDENCE (TUGAS HARIAN ANGGOTA)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {tasksForGoal.map((t: any) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: t.verified ? HP_TOKENS.sage : t.done ? HP_TOKENS.blue : HP_TOKENS.line }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: t.done ? HP_TOKENS.ink : HP_TOKENS.inkMute }}>{t.title}</div>
                              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>Oleh: {t.userName}</div>
                            </div>
                            {t.done && !t.verified && (
                              <button 
                                onClick={() => handleVerifyTask(t.id, g.id)}
                                className="hp-tap"
                                style={{
                                  padding: '4px 12px', borderRadius: 8, border: 'none',
                                  background: HP_TOKENS.sage, color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer'
                                }}
                              >
                                ACC
                              </button>
                            )}
                            {t.verified && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: HP_TOKENS.sage }}>
                                <HPGlyph name="check" size={14} color={HP_TOKENS.sage} />
                                <span style={{ fontSize: 10, fontWeight: 900 }}>VERIFIED</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {tasksForGoal.length === 0 && <div style={{ fontSize: 11, color: HP_TOKENS.inkMute, fontStyle: 'italic' }}>Belum ada tugas harian yang dihubungkan ke KPI ini.</div>}
                      </div>

                      {/* Approval Buttons */}
                      {isPending && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateState((s: any) => ({
                                ...s,
                                goals: s.goals.map((item: any) => item.id === g.id ? { ...item, status: 'approved' } : item)
                              }));
                            }}
                            className="hp-tap"
                            style={{
                              flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                              background: HP_TOKENS.sage, color: '#fff', fontFamily: HP_FONT, fontWeight: 800, fontSize: 11, cursor: 'pointer'
                            }}
                          >
                            Approve KPI
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateState((s: any) => ({
                                ...s,
                                goals: s.goals.map((item: any) => item.id === g.id ? { ...item, status: 'rejected' } : item)
                              }));
                            }}
                            className="hp-tap"
                            style={{
                              flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${HP_TOKENS.coral}`,
                              background: '#fff', color: HP_TOKENS.coral, fontFamily: HP_FONT, fontWeight: 800, fontSize: 11, cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </HPCard>
                </div>
              );
            })}
            {assignedGoals.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: HP_TOKENS.inkMute }}>Belum ada OKR yang ditugaskan.</div>}
          </div>
        </>
      )}

      {/* ── Personal Tasks ── */}
      {activeTab === 'personal' && (
        <>
          <SectionHeader 
            icon="sparkle" 
            label="Daily Tasks Saya" 
            count={String(personalTasks.length)} 
            action="+ Tambah Task"
            onAction={() => openModal('manage_priorities')}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {personalTasks.map((t: any) => (
              <HPCard key={t.id} padding={14}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button 
                    onClick={() => updateState((s: any) => ({
                      ...s,
                      priorities: s.priorities.map((p: any) => p.id === t.id ? { ...p, done: !p.done } : p)
                    }))}
                    style={{ 
                      width: 24, height: 24, borderRadius: 8, border: `2px solid ${t.done ? HP_TOKENS.sage : HP_TOKENS.line}`,
                      background: t.done ? HP_TOKENS.sage : 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {t.done && <HPGlyph name="check" size={14} color="#fff" />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 14, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? HP_TOKENS.inkMute : HP_TOKENS.ink }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>{t.goal || 'General'}</div>
                      <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.blue }}>{t.est || '15m'}</div>
                    </div>
                  </div>
                </div>
              </HPCard>
            ))}
            {personalTasks.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: HP_TOKENS.inkMute }}>Belum ada task harian. Mulai harimu dengan fokus!</div>}
          </div>
        </>
      )}

      {/* ── Members ── */}
      {activeTab === 'members' && (
        <>
          <SectionHeader icon="people" label="Anggota Tim" count={String(state.managerData?.members?.length || 0)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(state.managerData?.members || []).map((m: any) => (
              <HPCard key={m.id} padding={14}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <HPAvatar name={m.name} size={44} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 14 }}>{m.name}</div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginTop: 2 }}>{m.role}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HPGlyph name={m.mood === 'joy' ? 'sparkle' : m.mood === 'stress' ? 'zap' : 'activity'} size={14} color={HP_TOKENS.ink} />
                      </div>
                      <div style={{ flex: 1, height: 4, background: HP_TOKENS.lineSoft, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${m.wellbeing}%`, height: '100%', background: m.wellbeing > 70 ? HP_TOKENS.sage : m.wellbeing > 40 ? HP_TOKENS.yellow : HP_TOKENS.coral, borderRadius: 2 }} />
                      </div>
                      <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>
                        {m.wellbeing > 80 ? '😊' : m.wellbeing > 60 ? '🙂' : m.wellbeing > 40 ? '😐' : '😟'} WB {m.wellbeing}%
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 10, fontFamily: HP_FONT,
                      background: m.statusTone === 'sage' ? HP_TOKENS.sageSoft : m.statusTone === 'yellow' ? HP_TOKENS.yellowSoft : HP_TOKENS.coralSoft,
                      color: m.statusTone === 'sage' ? HP_TOKENS.sage : m.statusTone === 'yellow' ? '#8A6814' : HP_TOKENS.coral,
                      marginBottom: 4,
                    }}>
                      {m.status}
                    </div>
                    <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>
                      Task {m.tasks.done}/{m.tasks.total}
                    </div>
                  </div>
                </div>
              </HPCard>
            ))}
          </div>
        </>
      )}

      {/* ── Attendance ── */}
      {activeTab === 'attendance' && (
        <HRAttendanceView currentUser={user} />
      )}


    </div>
  );
}
