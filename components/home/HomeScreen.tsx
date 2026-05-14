"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useHP } from "@/lib/HPContext";
import { 
  HP_TOKENS, 
  HP_FONT, 
  HP_TEXT 
} from "@/lib/constants";
import { 
  HP_MOODS, 
  HP_ENERGY, 
  HP_AI_INSIGHTS, 
  HP_HABITS, 
} from "@/lib/mockData";
import { generateAIInsights } from "@/lib/aiInsights";
import HPGlyph from "@/components/ui/HPGlyph";
import HPAvatar from "@/components/ui/HPAvatar";
import HPCard from "@/components/ui/HPCard";
import HPBar from "@/components/ui/HPBar";
import BlobBackground from "@/components/home/BlobBackground";
import Confetti from "@/components/home/Confetti";
import EmotionalHero from "@/components/home/EmotionalHero";
import IntentionCard from "@/components/home/IntentionCard";
import SectionHeader from "@/components/home/SectionHeader";
import PriorityCard from "@/components/home/PriorityCard";
import InsightCard from "@/components/home/InsightCard";
import HabitCell from "@/components/home/HabitCell";
import BeeMascot from "@/components/ui/BeeMascot";
import CelebrationOverlay from "@/components/ui/CelebrationOverlay";


interface HomeScreenProps {
  tab: string;
  openModal: (name: string, props?: any) => void;
}

const iconBtnStyle: React.CSSProperties = {
  position: 'relative', width: 40, height: 40, borderRadius: 20, border: `1px solid ${HP_TOKENS.line}`,
  background: HP_TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

export default function HomeScreen({ openModal }: any) {
  const { state, updateState, updateUser, user, syncSkillProgress, awardXP } = useHP();
  const [greeting, setGreeting] = useState('');
  const [confetti, setConfetti] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [reminder, setReminder] = useState<{ type: 'break' | 'clockout' | 'meeting', mins: number, sessionWith?: string } | null>(null);
  const [coachNudge, setCoachNudge] = useState<{ text: string, type: 'support' | 'warning' | 'cheer' }>({ 
    text: "Semangat ya! Kamu sudah melakukan yang terbaik hari ini. ✨", 
    type: 'cheer' 
  });


  useEffect(() => {
    const h = new Date().getHours();
    if (h < 11) setGreeting('Selamat pagi');
    else if (h < 15) setGreeting('Selamat siang');
    else if (h < 19) setGreeting('Selamat sore');
    else setGreeting('Selamat malam');

    // Time Check for Reminders
    const checkTime = () => {
      if (!state?.workSchedule) return;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      const parseTime = (t: string) => {
        const [hh, mm] = t.split(':').map(Number);
        return hh * 60 + mm;
      };

      const breakStart = parseTime(state.workSchedule.breakStart);
      const workEnd = parseTime(state.workSchedule.end);

      // Check break reminder (15 mins before)
      if (currentMins >= breakStart - 15 && currentMins < breakStart) {
        setReminder({ type: 'break', mins: breakStart - currentMins });
      } else if (currentMins >= workEnd - 15 && currentMins < workEnd) {
        setReminder({ type: 'clockout', mins: workEnd - currentMins });
      } else {
        setReminder(null);
      }
    };


    checkTime();
    const interval = setInterval(checkTime, 60000);

    // AI Nudge Logic (Duolingo Style)
    const generateNudge = () => {
      if (!state) return;
      
      const now = new Date();
      const lastAct = state.lastActivityDate ? new Date(state.lastActivityDate) : now;
      const hoursInactive = (now.getTime() - lastAct.getTime()) / (1000 * 60 * 60);

      // 1. Inactivity Check (> 3 hours)
      if (hoursInactive >= 3) {
        setCoachNudge({
          text: "Hai! Aku lihat kamu belum update task selama 3 jam. Ada kendala yang bisa aku bantu? 🤔",
          type: 'warning'
        });
        return;
      }

      // 2. Fatigue/Stress Check
      if (state.mood === 'tired' || state.mood === 'stress') {
        setCoachNudge({
          text: "Kamu terlihat lelah. Coba istirahat 5 menit atau minum air putih dulu yuk. Kesehatanmu prioritas utama! 💧",
          type: 'support'
        });
        return;
      }

      // 3. Positive Reinforcement
      const cheerMessages = [
        "Progress OKR kamu keren hari ini! Pertahankan ritmenya. ✨",
        "Kecil tapi rutin itu lebih baik. Terus melangkah ya! 🌱",
        "Kamu luar biasa! Sudah 12 hari streak check-in tanpa putus. 🔥",
        "Jangan lupa bernapas dalam-dalam. Kamu memegang kendali hari ini. 🧘‍♂️"
      ];
      setCoachNudge({
        text: cheerMessages[Math.floor(Math.random() * cheerMessages.length)],
        type: 'cheer'
      });
    };

    generateNudge();
    
    return () => clearInterval(interval);
  }, [state?.workSchedule, state?.mood, state?.lastActivityDate]);



  if (!state || !user) return null;

  const { mood, energy, priorities } = state;
  const moodObj = HP_MOODS.find(m => m.key === mood);
  const energyObj = HP_ENERGY.find(e => e.key === energy);
  const done = priorities.filter((p: any) => p.done).length;
  const total = priorities.length;

  const calculateLevelProgress = (points: number) => {
    if (points < 1000) return (points % 100) / 100;
    if (points < 4000) return ((points - 1000) % 300) / 300;
    return ((points - 4000) % 1000) / 1000;
  };

  const levelProgress = calculateLevelProgress(user.points);

  const beeMood = useMemo(() => {
    if (!state) return 'happy';
    const now = new Date();
    const lastAct = state.lastActivityDate ? new Date(state.lastActivityDate) : now;
    const hoursInactive = (now.getTime() - lastAct.getTime()) / (1000 * 60 * 60);

    if (hoursInactive > 4) return 'sad';
    if (state.mood === 'tired' || state.mood === 'burnout') return 'sleepy';
    if (state.mood === 'stress' || state.mood === 'anxious') return 'surprised';
    return 'happy';
  }, [state]);

  const togglePriority = useCallback((id: number) => {
    updateState((s: any) => {
      const pIndex = s.priorities.findIndex((p: any) => p.id === id);
      const priority = s.priorities[pIndex];
      const wasDone = priority.done;
      
      if (!wasDone) { 
        setConfetti(true); 
        setCelebrate(true);
        setTimeout(() => setConfetti(false), 1200); 
        awardXP('priority_complete', `Selesaikan: ${priority.title}`);
      }
      const newPriorities = [...s.priorities];
      newPriorities[pIndex] = { ...newPriorities[pIndex], done: !wasDone };
      
      const update: any = { priorities: newPriorities };

      // Recalculate goal progress based on updated tasks
      if (priority.goal_id && s.goals) {
        const updatedGoals = s.goals.map((g: any) => {
          if (String(g.id) === String(priority.goal_id)) {
            const tasksForGoal = newPriorities.filter((p: any) => p.goal_id && String(p.goal_id) === String(g.id));
            const doneCount = tasksForGoal.filter((p: any) => p.done).length;
            const newProgress = tasksForGoal.length > 0 
              ? Math.round((doneCount / tasksForGoal.length) * 100) 
              : g.progress;
            return { ...g, progress: newProgress, metric: `${doneCount}/${tasksForGoal.length} task selesai` };
          }
          return g;
        });
        update.goals = updatedGoals;
      }

      if (!wasDone) {
        const now = new Date();
        update.lastActivityDate = now.toISOString();
        update.penaltyActive = false;
        syncSkillProgress(newPriorities[pIndex].title + " " + (newPriorities[pIndex].goal || ""), 2);

        const newLog = {
          id: Date.now(),
          type: 'quest_completion',
          title: newPriorities[pIndex].title,
          points: 50,
          date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          day: now.toLocaleDateString('id-ID', { weekday: 'long' }),
          time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        update.logbook = [newLog, ...(s.logbook || [])];
      }
      return { ...s, ...update };
    });
  }, [updateState, awardXP, syncSkillProgress]);

  const toggleHabit = useCallback((name: string) => {
    updateState((s: any) => {
      const hIndex = s.habits.findIndex((h: any) => h.name === name);
      const habit = s.habits[hIndex];
      const wasDone = habit.done;
      
      const newHabits = [...s.habits];
      newHabits[hIndex] = { ...newHabits[hIndex], done: !wasDone };

      if (!wasDone) { 
        setConfetti(true); 
        setCelebrate(true);
        setTimeout(() => setConfetti(false), 1200); 
        awardXP('habit_complete', `Latihan: ${name}`);

        const now = new Date();
        const newLog = {
          id: Date.now(),
          type: 'habit_completion',
          habitName: name,
          glyph: habit.glyph,
          points: 30,
          date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          day: now.toLocaleDateString('id-ID', { weekday: 'long' }),
          time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };

        return { ...s, habits: newHabits, logbook: [newLog, ...(s.logbook || [])], lastActivityDate: now.toISOString(), penaltyActive: false };
      } else {
        return { ...s, habits: newHabits };
      }
    });
  }, [updateState, awardXP]);

  const energyHint = (e: string) => {
    if (e === 'low') return 'Energimu sedang rendah 🌱 Mulai dari task ringan dulu — handoff sinkron ikon cocok sekarang.';
    if (e === 'mid') return 'Energi sedang pas untuk kolaborasi 🌿 Review wireframe dulu, kirim handoff setelah lunch.';
    return 'Energi tinggi — cocok untuk deep work 🔥 Blok 90 menit tanpa gangguan?';
  };

  // Memoize AI insights at top level (not inside JSX)
  const aiInsights = useMemo(() => generateAIInsights(state, user), [state, user]);

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 120, fontFamily: HP_FONT }}>
      <BlobBackground colors={[HP_TOKENS.yellowWash, '#fff', HP_TOKENS.paper]}/>
      <Confetti show={confetti}/>
      <CelebrationOverlay show={celebrate} onComplete={() => setCelebrate(false)} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 16px' }} className="hp-stagger">
        {/* Top Card - Profile & Level */}
        <div style={{ 
          background: HP_TOKENS.card,
          borderRadius: 24,
          padding: '24px',
          marginTop: 16,
          border: `1px solid ${HP_TOKENS.line}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 18, right: 18 }}>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 openModal('system_guide');
               }}
               style={{
                 width: 34, height: 34, borderRadius: 10, border: `1px solid ${HP_TOKENS.line}`,
                 background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                 cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
               }}
               className="hp-tap"
             >
               <HPGlyph name="book" size={16} color={HP_TOKENS.blue} />
             </button>
          </div>

          <div 
            onClick={() => openModal('profile_editor')}
            className="hp-tap"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <HPAvatar 
                  name={user.name} 
                  size={56} 
                  rank={user.rank}
                  levelProgress={levelProgress} 
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ ...HP_TEXT.h, fontSize: 20 }}>{user.name.split(' ')[0]}</div>
                  <div style={{ 
                    background: HP_TOKENS.yellow, color: HP_TOKENS.ink, fontSize: 10, fontWeight: 900, 
                    padding: '2px 8px', borderRadius: 6, letterSpacing: 0.5 
                  }}>
                    LV. {user.level}
                  </div>
                </div>
                <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                  {user.rank} Rank Specialist
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="hp-tap" style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12,
                background: HP_TOKENS.yellowSoft, fontFamily: HP_FONT, fontWeight: 900, fontSize: 14, color: HP_TOKENS.ink,
                border: `1px solid ${HP_TOKENS.yellow}`,
              }}>
                <HPGlyph name="zap" size={14} color={HP_TOKENS.ink} />
                <span>{user.streak}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginBottom: 4 }}>Level Progress</div>
              <div style={{ width: '100%', height: 6, background: HP_TOKENS.lineSoft, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${levelProgress * 100}%`, height: '100%', 
                  background: HP_TOKENS.yellow, 
                  transition: '1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginBottom: 4 }}>Total Points</div>
              <div style={{ ...HP_TEXT.h, fontSize: 24 }}>{user.points.toLocaleString()}</div>
            </div>
          </div>

          {/* AI Coach Nudge with Bee Mascot */}
          <div style={{ 
            background: HP_TOKENS.blueWash,
            borderRadius: 20,
            padding: '16px 20px',
            border: `1px solid ${HP_TOKENS.blue}30`,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 20
          }}>
            <BeeMascot mood={beeMood} size={60} showSpeech="" />
            <div style={{ ...HP_TEXT.body, fontSize: 13, fontWeight: 700, lineHeight: 1.5, color: HP_TOKENS.ink }}>
              {coachNudge.text}
            </div>
          </div>
          <div style={{ 
            display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 16, 
            background: HP_TOKENS.paper, border: `1px solid ${HP_TOKENS.line}`,
            marginBottom: 16
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 2 }}>JAM KERJA</div>
              <div style={{ ...HP_TEXT.body, fontSize: 13, fontWeight: 800 }}>
                {state.todayAttendance?.checkIn || state.workSchedule?.start} - {state.todayAttendance?.checkOut || state.workSchedule?.end}
              </div>
            </div>
            <div style={{ width: 1, background: HP_TOKENS.line }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 2 }}>ISTIRAHAT</div>
              <div style={{ ...HP_TEXT.body, fontSize: 13, fontWeight: 800 }}>
                {state.workSchedule?.breakStart} - {state.workSchedule?.breakEnd}
              </div>
            </div>
          </div>


          {/* Check-in Button */}
          <button 
            onClick={() => openModal('attendance_scanner')}
            style={{
              width: '100%', padding: '14px', borderRadius: 16, background: HP_TOKENS.ink, color: '#fff',
              border: 'none', fontFamily: HP_FONT, fontWeight: 800, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: 12
            }} className="hp-tap"
          >
            <HPGlyph name="target" size={18} color="#fff" />
            Check-in Office
          </button>
        </div>

        {/* HERO — Emotional check-in */}
        <div style={{ marginTop: 16 }}>
          <EmotionalHero 
            state={state} 
            moodObj={moodObj} 
            energyObj={energyObj} 
            onOpenCheckIn={() => openModal('checkin')}
          />
        </div>

        {/* Smart Reminders */}
        {reminder && (
          <div style={{ marginTop: 16 }}>
            <HPCard padding={16} style={{ 
              background: reminder.type === 'break' ? HP_TOKENS.yellowWash : HP_TOKENS.sageWash, 
              border: `1.5px solid ${reminder.type === 'break' ? HP_TOKENS.yellow : HP_TOKENS.sage}`,
              animation: 'hpBounce 1s infinite'
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: 14, 
                  background: reminder.type === 'break' ? HP_TOKENS.yellow : reminder.type === 'meeting' ? HP_TOKENS.blue : HP_TOKENS.sage,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>
                  {reminder.type === 'break' ? '🥪' : reminder.type === 'meeting' ? '🎥' : '🌙'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...HP_TEXT.h, fontSize: 15 }}>
                    {reminder.type === 'break' ? 'Waktunya Istirahat!' : 'Bentar lagi Pulang!'}
                  </div>
                  <div style={{ ...HP_TEXT.body, fontSize: 13, marginTop: 2 }}>
                    {reminder.type === 'break' && `${reminder.mins} menit lagi istirahat. Yuk, siap-siap rehat sejenak! 🌿`}
                    {reminder.type === 'meeting' && `${reminder.mins} menit lagi meeting dengan ${reminder.sessionWith}. Link Meet sudah siap! 🚀`}
                    {reminder.type === 'clockout' && `${reminder.mins} menit lagi jam kerja selesai. Yuk, persiapkan refleksi Tutup Hari kamu! ✨`}
                  </div>
                </div>

                {reminder.type === 'clockout' && (
                  <button 
                    onClick={() => openModal('reflect')}
                    className="hp-tap"
                    style={{ 
                      padding: '8px 14px', borderRadius: 10, border: 'none', 
                      background: HP_TOKENS.sage, color: '#fff', 
                      fontFamily: HP_FONT, fontWeight: 800, fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    Tutup Hari
                  </button>
                )}
                {reminder.type === 'meeting' && (
                  <button 
                    onClick={() => state.coaching?.meetLink && window.open(state.coaching.meetLink, '_blank')}
                    className="hp-tap"
                    style={{ 
                      padding: '8px 14px', borderRadius: 10, border: 'none', 
                      background: HP_TOKENS.blue, color: '#fff', 
                      fontFamily: HP_FONT, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <HPGlyph name="video" size={12} color="#fff" />
                    Join Meet
                  </button>
                )}
              </div>
            </HPCard>
          </div>
        )}


        {/* Intention */}

        <div style={{ marginTop: 12 }}>
          <IntentionCard state={state} setState={updateState}/>
        </div>

        {/* Company Contacts */}
        <div style={{ marginTop: 20 }}>
          <SectionHeader 
            icon="phone" 
            label="Kontak Penting" 
            count={String(state.contacts?.length || 0)} 
            action="+ Kelola"
            onAction={() => openModal('manage_contacts')}
          />
          
          {/* Public Contacts */}
          <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 800, marginBottom: 8, letterSpacing: 0.5 }}>UMUM</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
            {(state.contacts || []).filter(c => !c.isPrivate).map(contact => (
              <HPCard 
                key={contact.id} 
                padding={12} 
                style={{ minWidth: 200, flexShrink: 0, background: '#fff', border: `1px solid ${HP_TOKENS.line}` }}
              >
                <div style={{ ...HP_TEXT.h, fontSize: 13 }}>{contact.name}</div>
                <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginBottom: 8 }}>{contact.role}</div>
                
                <div style={{ display: 'flex', gap: 6 }}>
                  <a 
                    href={`tel:${contact.phone}`} 
                    style={{ 
                      flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: HP_TOKENS.blueSoft, color: HP_TOKENS.blue, padding: '6px 0', borderRadius: 8,
                      fontFamily: HP_FONT, fontSize: 11, fontWeight: 800
                    }}
                  >
                    Hubungi
                  </a>
                  <a 
                    href={`mailto:${contact.email}`} 
                    style={{ 
                      flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: HP_TOKENS.sageSoft, color: HP_TOKENS.sage, padding: '6px 0', borderRadius: 8,
                      fontFamily: HP_FONT, fontSize: 11, fontWeight: 800
                    }}
                  >
                    Email
                  </a>
                </div>
              </HPCard>
            ))}
          </div>

          {/* Private Contacts */}
          {(state.contacts || []).some(c => c.isPrivate) && (
            <div style={{ marginTop: 12 }}>
              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 800, marginBottom: 8, letterSpacing: 0.5 }}>PRIVAT</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                {(state.contacts || []).filter(c => c.isPrivate).map(contact => (
                  <HPCard 
                    key={contact.id} 
                    padding={12} 
                    style={{ minWidth: 200, flexShrink: 0, background: HP_TOKENS.yellowWash, border: `1px solid ${HP_TOKENS.yellow}40` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ ...HP_TEXT.h, fontSize: 13 }}>{contact.name}</div>
                        <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginBottom: 8 }}>{contact.role}</div>
                      </div>
                      <HPGlyph name="sparkle" size={12} color={HP_TOKENS.yellow} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a 
                        href={`tel:${contact.phone}`} 
                        style={{ 
                          flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: HP_TOKENS.ink, color: '#fff', padding: '6px 0', borderRadius: 8,
                          fontFamily: HP_FONT, fontSize: 11, fontWeight: 800
                        }}
                      >
                        Hubungi
                      </a>
                    </div>
                  </HPCard>
                ))}
              </div>
            </div>
          )}
        </div>



        {/* LAYER 2 — Task Management & Realization */}
        <div style={{ marginTop: 24 }}>
          <SectionHeader 
            icon="target" 
            label="Task Management (Realisasi)" 
            count={`${done}/${total}`} 
            action="Manage"
            onAction={() => openModal('manage_priorities')}
          />
          
          {/* Realization Progress Card */}
          <HPCard padding={20} style={{ 
            marginBottom: 20, 
            background: `linear-gradient(135deg, ${HP_TOKENS.sageWash} 0%, #fff 100%)`, 
            border: `1.5px solid ${HP_TOKENS.sage}20`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background element */}
            <div style={{ 
              position: 'absolute', right: -20, top: -20, width: 100, height: 100, 
              borderRadius: 50, background: `${HP_TOKENS.sage}10`, zIndex: 0 
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                <div>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.sage, fontWeight: 900, letterSpacing: 1, marginBottom: 4 }}>REALISASI TARGET</div>
                  <div style={{ ...HP_TEXT.h, fontSize: 24 }}>{total > 0 ? Math.round((done / total) * 100) : 0}% <span style={{ fontSize: 14, color: HP_TOKENS.inkFade, fontWeight: 600 }}>Selesai</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...HP_TEXT.h, fontSize: 16, color: HP_TOKENS.sage }}>{done}/{total}</div>
                  <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700 }}>Quests Done</div>
                </div>
              </div>
              
              <div style={{ position: 'relative', height: 10, background: HP_TOKENS.lineSoft, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${total > 0 ? (done / total) * 100 : 0}%`, 
                  height: '100%', 
                  background: `linear-gradient(to right, ${HP_TOKENS.sage}, #4ADE80)`, 
                  borderRadius: 5,
                  transition: '1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  boxShadow: `0 0 12px ${HP_TOKENS.sage}40`
                }} />
              </div>

              <button 
                onClick={() => openModal('work_checkin')}
                className="hp-tap"
                style={{ 
                  marginTop: 20, width: '100%', padding: '12px', borderRadius: 14,
                  background: HP_TOKENS.ink, border: 'none', color: '#fff',
                  fontFamily: HP_FONT, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <HPGlyph name="sparkle" size={16} color={HP_TOKENS.yellow} />
                Cek Realisasi & Tips Fokus
              </button>
            </div>
          </HPCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {priorities.map((p: any) => (
              <PriorityCard key={p.id} p={p} onToggle={() => togglePriority(p.id)}/>
            ))}
            <button onClick={() => openModal('focus')} className="hp-tap" style={{
              padding: '16px', borderRadius: 16, border: 'none',
              background: HP_TOKENS.ink,
              color: HP_TOKENS.yellow, cursor: 'pointer', fontFamily: HP_FONT, fontWeight: 800, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              marginTop: 4,
            }}>
              <HPGlyph name="sparkle" size={20} color={HP_TOKENS.yellow}/>
              <span>Start Focus Session</span>
            </button>
          </div>
        </div>


        {/* Energy-based suggestion */}
        {energy && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 16,
            background: HP_TOKENS.paper,
            border: `1px solid ${HP_TOKENS.line}`,
            display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: HP_TOKENS.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HPGlyph name="activity" size={20} color={HP_TOKENS.blue} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...HP_TEXT.h, fontSize: 14, color: HP_TOKENS.blue }}>System Insight</div>
              <div style={{ ...HP_TEXT.body, fontSize: 13, marginTop: 2 }}>{energyHint(energy)}</div>
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

        {/* Habits - Moved to Wellbeing for Employee */}
        {user.role !== 'employee' && (
          <div style={{ marginTop: 24 }}>
            <SectionHeader 
              icon="leaf" 
              label="Daily Training" 
              action="Settings"
              onAction={() => openModal('manage_habits')}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {state.habits.map((h: any, i: number) => (
                <HabitCell key={i} h={h} onToggle={() => toggleHabit(h.name)}/>
              ))}
            </div>
          </div>
        )}

        {/* Professional Growth */}
        <div style={{ marginTop: 24 }}>
          <SectionHeader icon="heart" label="AI Coach Insights" action="Explore" onAction={() => openModal('coach')}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aiInsights.map((ins, i) => (
              <InsightCard key={i} ins={ins} idx={i}/>
            ))}
          </div>
        </div>

        {/* Closing actions */}
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => openModal('reflect')} className="hp-tap" style={{
            width: '100%', padding: '18px', borderRadius: 16,
            background: HP_TOKENS.yellow, color: HP_TOKENS.ink,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontFamily: HP_FONT, fontWeight: 800, fontSize: 15,
          }}>
            <HPGlyph name="moon" size={20} color={HP_TOKENS.ink} />
            <span>Evening Reflection</span>
          </button>

          <button onClick={() => openModal('logbook')} className="hp-tap" style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'transparent', color: HP_TOKENS.inkMute,
            border: `1.5px solid ${HP_TOKENS.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: HP_FONT, fontWeight: 700, fontSize: 14,
          }}>
            <HPGlyph name="book" size={18} color={HP_TOKENS.inkMute}/>
            <span>View Activity Logbook</span>
          </button>

        </div>
      </div>
    </div>
  );
}

