"use client";

import React, { useState, useEffect } from "react";
import { useHP } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import HPGlyph from "@/components/ui/HPGlyph";
import HPAvatar from "@/components/ui/HPAvatar";
import HPBar from "@/components/ui/HPBar";
import HPCard from "@/components/ui/HPCard";

interface MemberLogbookModalProps {
  onClose: () => void;
  memberId: string;
  memberName: string;
  goalId?: string;
  goalTitle?: string;
}

export default function MemberLogbookModal({ onClose, memberId, memberName, goalId, goalTitle }: MemberLogbookModalProps) {
  const { state, updateState, user } = useHP();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  // Mocking some historical data for the UI/UX demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockLogs = [
        {
          date: '2026-05-15',
          label: 'Hari ini',
          tasks: state?.managerData?.teamTasks?.filter((t: any) => String(t.userId) === String(memberId)) || []
        },
        {
          date: '2026-05-14',
          label: 'Kemarin',
          tasks: [
            { id: 'h1', title: 'Finalize design system tokens', done: true, verified: true, tone: 'blue' },
            { id: 'h2', title: 'Meeting with stakeholders', done: true, verified: true, tone: 'sage' },
            { id: 'h3', title: 'Update documentation', done: true, verified: true, tone: 'lavender' }
          ]
        },
        {
          date: '2026-05-13',
          label: '13 Mei',
          tasks: [
            { id: 'h4', title: 'User testing session #3', done: true, verified: true, tone: 'coral' },
            { id: 'h5', title: 'Iterate based on feedback', done: true, verified: true, tone: 'yellow' }
          ]
        }
      ];
      setLogs(mockLogs);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [memberId, state?.managerData?.teamTasks]);

  const handleVerify = async (taskId: string) => {
    try {
      const res = await fetch("/api/manager/verify-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, goalId, managerId: user?.id })
      });

      if (!res.ok) throw new Error("Failed");

      // Update local state to reflect verification
      updateState((s: any) => {
        const newTeamTasks = s.managerData?.teamTasks?.map((t: any) => 
          t.id === taskId ? { ...t, verified: true } : t
        ) || [];
        
        return {
          ...s,
          managerData: {
            ...s.managerData,
            teamTasks: newTeamTasks
          }
        };
      });

      // Update current view logs
      setLogs(prev => prev.map(day => ({
        ...day,
        tasks: day.tasks.map((t: any) => t.id === taskId ? { ...t, verified: true } : t)
      })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal onClose={onClose} title="Member Logbook 📋" noPadding>
      <div style={{ padding: '0 20px 24px' }}>
        {/* Header Info */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0',
          borderBottom: `1.5px solid ${HP_TOKENS.lineSoft}`, marginBottom: 20
        }}>
          <HPAvatar name={memberName} size={54} />
          <div style={{ flex: 1 }}>
            <div style={{ ...HP_TEXT.h, fontSize: 18 }}>{memberName}</div>
            <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginTop: 2 }}>{goalTitle || 'KPI Progress'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: HP_TOKENS.sage }}>85%</div>
            <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkFade }}>Alignment</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ display: 'inline-block', width: 24, height: 24, border: `3px solid ${HP_TOKENS.line}`, borderTopColor: HP_TOKENS.blue, borderRadius: '50%', animation: 'hpSpin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {logs.map((day, idx) => (
              <div key={day.date}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                  position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '8px 0'
                }}>
                  <div style={{ 
                    padding: '6px 14px', borderRadius: 12, 
                    background: idx === 0 ? HP_TOKENS.blue : HP_TOKENS.paper,
                    border: `1.5px solid ${idx === 0 ? HP_TOKENS.blue : HP_TOKENS.lineSoft}`,
                    color: idx === 0 ? '#fff' : HP_TOKENS.inkSoft, 
                    fontSize: 10, fontWeight: 900, letterSpacing: '0.05em',
                    boxShadow: idx === 0 ? `0 4px 12px ${HP_TOKENS.blue}40` : 'none'
                  }}>
                    {day.label.toUpperCase()} — {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                  </div>
                  <div style={{ height: 1.5, flex: 1, background: HP_TOKENS.lineSoft, opacity: 0.5 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {day.tasks.length === 0 ? (
                    <div style={{ 
                      padding: '20px', textAlign: 'center', borderRadius: 20, 
                      background: HP_TOKENS.paper, border: `1.5px dashed ${HP_TOKENS.line}`,
                      color: HP_TOKENS.inkFade, fontSize: 12, fontStyle: 'italic'
                    }}>
                      Tidak ada aktivitas tercatat pada tanggal ini.
                    </div>
                  ) : (
                    day.tasks.map((t: any) => (
                      <HPCard key={t.id} padding={16} style={{ 
                        border: t.verified ? `1.5px solid ${HP_TOKENS.sage}30` : t.done ? `1.5px solid ${HP_TOKENS.yellow}40` : `1.5px solid ${HP_TOKENS.lineSoft}`,
                        background: t.verified ? HP_TOKENS.sageWash : '#fff',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        borderRadius: 22,
                        transition: 'transform 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ 
                            width: 40, height: 40, borderRadius: 14, 
                            background: t.verified ? HP_TOKENS.sage : t.done ? HP_TOKENS.yellow : HP_TOKENS.lineSoft,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: t.verified ? `0 4px 12px ${HP_TOKENS.sage}40` : t.done ? `0 4px 12px ${HP_TOKENS.yellow}40` : 'none'
                          }}>
                            <HPGlyph name={t.verified ? "check" : t.done ? "zap" : "activity"} size={20} color={t.verified || t.done ? "#fff" : HP_TOKENS.inkMute} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...HP_TEXT.h, fontSize: 15, color: HP_TOKENS.ink, lineHeight: 1.3 }}>{t.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                              <div style={{ 
                                padding: '2px 8px', borderRadius: 6, background: HP_TOKENS.paper,
                                fontSize: 10, fontWeight: 800, color: HP_TOKENS.inkMute 
                              }}>
                                {t.est || '15m'}
                              </div>
                              {t.verified && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: 2, background: HP_TOKENS.sage }} />
                                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.sage, fontWeight: 900, fontSize: 9 }}>VERIFIED</div>
                                </div>
                              )}
                              {!t.verified && t.done && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: 2, background: HP_TOKENS.yellow }} />
                                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.yellow, fontWeight: 900, fontSize: 9 }}>WAITING FOR ACC</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {t.done && !t.verified && (
                            <button 
                              onClick={() => handleVerify(t.id)}
                              className="hp-tap"
                              style={{
                                padding: '10px 20px', borderRadius: 12, border: 'none',
                                background: HP_TOKENS.sage, color: '#fff', fontSize: 12, fontWeight: 900, 
                                cursor: 'pointer', boxShadow: `0 4px 12px ${HP_TOKENS.sage}40`
                              }}
                            >
                              ACC
                            </button>
                          )}
                          {t.verified && (
                            <div style={{ 
                              width: 32, height: 32, borderRadius: 16, background: HP_TOKENS.sageWash,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: HP_TOKENS.sage
                            }}>
                              <HPGlyph name="check" size={20} />
                            </div>
                          )}
                        </div>
                      </HPCard>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes hpSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
}
