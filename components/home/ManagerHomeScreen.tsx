"use client";

import React from "react";
import { useHP } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import {
  MANAGER_TEAM_MEMBERS,
} from "@/lib/mockData";
import HPGlyph from "@/components/ui/HPGlyph";
import HPCard from "@/components/ui/HPCard";
import HPAvatar from "@/components/ui/HPAvatar";
import SectionHeader from "@/components/home/SectionHeader";
import BlobBackground from "@/components/home/BlobBackground";
import BeeMascot from "@/components/ui/BeeMascot";

interface Props { openModal: (name: string, props?: any) => void; }

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

export default function ManagerHomeScreen({ openModal }: Props) {
  const { state, user, awardXP } = useHP();
  const managerData = state?.managerData || { members: [], goals: [], approvals: [] };
  const { members, goals } = managerData;
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((a: number, b: any) => a + Number(b.progress), 0) / goals.length) : 0;

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

            {/* Team health bar - Only showing OKR Progress now */}
            <div style={{
              background: HP_TOKENS.lineSoft, borderRadius: 20, padding: '16px 20px', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>🎯</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute }}>RATA-RATA PROGRES OKR TIM</div>
                  <div style={{ fontFamily: HP_FONT, fontWeight: 900, fontSize: 22, color: HP_TOKENS.blue, marginTop: -2 }}>
                    {avgProgress}<span style={{ fontSize: 14, color: HP_TOKENS.inkMute }}>%</span>
                  </div>
                </div>
              </div>
              <div style={{ width: 60, height: 60, position: 'relative' }}>
                 {/* Simple progress ring indicator if needed, but text is enough */}
                 <div style={{ 
                    position: 'absolute', inset: 0, borderRadius: '50%', 
                    border: `4px solid ${HP_TOKENS.blue}20`,
                 }} />
                 <div style={{ 
                    position: 'absolute', inset: 0, borderRadius: '50%', 
                    border: `4px solid ${HP_TOKENS.blue}`,
                    clipPath: `inset(0 ${100 - avgProgress}% 0 0)` // Placeholder for circular progress
                 }} />
              </div>
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
          <SectionHeader icon="people" label="Status Tim Hari Ini" count={`${members.length} orang`} />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ ...HP_TEXT.small, fontWeight: 800, color: HP_TOKENS.inkSoft }}>
                      {m.tasks.done}/{m.tasks.total} Task
                    </div>
                    <HPGlyph name="chevronRight" size={14} color={HP_TOKENS.line} />
                  </div>
                </div>
              ))}
            </div>
          </HPCard>
        </div>



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
