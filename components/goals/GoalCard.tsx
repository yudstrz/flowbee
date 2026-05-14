"use client";

import React from "react";
import { HP_TOKENS, HP_TEXT } from "@/lib/constants";
import { useHP } from "@/lib/HPContext";
import HPCard from "@/components/ui/HPCard";
import HPChip from "@/components/ui/HPChip";
import HPBar from "@/components/ui/HPBar";
import HPGlyph from "@/components/ui/HPGlyph";

interface GoalCardProps {
  g: any;
}

export default function GoalCard({ g }: GoalCardProps) {
  const { state, updateState, awardXP } = useHP();
  const tones: Record<string, string> = { 
    sage: HP_TOKENS.sage, 
    blue: HP_TOKENS.blue, 
    lavender: HP_TOKENS.lavender || '#6B5F8E',
    yellow: HP_TOKENS.yellow,
    coral: HP_TOKENS.coral,
  };

  const parentGoal = g.parent_id ? state?.goals.find((item: any) => String(item.id) === String(g.parent_id)) : null;

  // Link to actual priorities (tasks) in state that are connected to this goal
  const linkedTasks = state?.priorities?.filter((p: any) => p.goal_id && String(p.goal_id) === String(g.id)) || [];
  const hasTasks = linkedTasks.length > 0;
  const doneTaskCount = linkedTasks.filter((p: any) => p.done).length;
  
  // Always use task-based progress when tasks are linked; otherwise use stored progress
  const displayProgress = hasTasks 
    ? Math.round((doneTaskCount / linkedTasks.length) * 100)
    : (g.progress || 0);

  const deleteGoal = () => {
    if (confirm(`Hapus goal "${g.title}"?`)) {
      updateState((s: any) => ({
        ...s,
        goals: s.goals.filter((item: any) => item.id !== g.id)
      }));
    }
  };

  const toggleTask = (taskId: number) => {
    updateState((s: any) => {
      const taskIndex = s.priorities.findIndex((p: any) => p.id === taskId);
      if (taskIndex === -1) return s;
      
      const task = s.priorities[taskIndex];
      const wasDone = task.done;
      
      // Award XP and show confetti if completing
      if (!wasDone) {
        awardXP('priority_complete', `Selesaikan: ${task.title}`);
        // Confetti is usually handled in HomeScreen, but we can trigger it if we have access to setConfetti
        // Since setConfetti is local to HomeScreen, we might need a more global way or just skip it here.
        // For now, let's just update the state.
      }

      const newPriorities = [...s.priorities];
      newPriorities[taskIndex] = { ...newPriorities[taskIndex], done: !wasDone };

      // Recalculate goal progress
      const updatedGoals = s.goals.map((goal: any) => {
        if (String(goal.id) === String(g.id)) {
            const tasksForGoal = newPriorities.filter((p: any) => p.goal_id && String(p.goal_id) === String(goal.id));
          const doneCount = tasksForGoal.filter((p: any) => p.done).length;
          const newProgress = tasksForGoal.length > 0 
            ? Math.round((doneCount / tasksForGoal.length) * 100) 
            : goal.progress;
          return { ...goal, progress: newProgress, metric: `${doneCount}/${tasksForGoal.length} task selesai` };
        }
        return goal;
      });

      return {
        ...s,
        priorities: newPriorities,
        goals: updatedGoals,
        lastActivityDate: !wasDone ? new Date().toISOString() : s.lastActivityDate
      };
    });
  };

  const toneColor = tones[g.tone] || HP_TOKENS.sage;
  
  return (
    <HPCard padding={16} style={{ 
      border: `1.5px solid ${HP_TOKENS.line}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 24, height: 24, borderRadius: 8, 
              background: `${toneColor}15`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <HPGlyph name="target" size={14} color={toneColor} />
            </div>
            <div style={{ ...HP_TEXT.h, fontSize: 16 }}>{g.title}</div>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteGoal(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 7, background: HP_TOKENS.lineSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: HP_TOKENS.inkFade, fontWeight: 900 }}>×</span>
              </div>
            </button>
          </div>
          {parentGoal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, marginLeft: 32 }}>
              <HPGlyph name="link" size={10} color={HP_TOKENS.blue} />
              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.blue, fontWeight: 800, fontSize: 10 }}>
                Aligned to: {parentGoal.title}
              </div>
            </div>
          )}
          <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, marginTop: 6, marginLeft: 32, fontSize: 12 }}>
             {hasTasks ? `${doneTaskCount}/${linkedTasks.length} task selesai` : (g.metric || 'Realisasi')} · <span style={{ fontWeight: 700 }}>Due:</span> {g.due}
          </div>
        </div>
        <HPChip tone={g.tone} size="sm">{g.alignment}% align</HPChip>
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
             <span style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 800 }}>PROGRESS</span>
             <span style={{ ...HP_TEXT.h, fontSize: 13, color: toneColor }}>{displayProgress}%</span>
          </div>
          <HPBar value={displayProgress} tone={g.tone} height={8}/>
        </div>
      </div>

      {linkedTasks.length > 0 && (
        <div style={{ 
          marginTop: 16, 
          padding: '12px', 
          background: HP_TOKENS.paper,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 900, fontSize: 9, letterSpacing: 1 }}>
              LINKED QUESTS ({doneTaskCount}/{linkedTasks.length})
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); updateState((s: any) => ({ ...s, modal: { name: 'manage_priorities', props: { initialGoal: g.title } } })); }}
              style={{ background: HP_TOKENS.sageSoft, border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <HPGlyph name="target" size={8} color={HP_TOKENS.sage} />
              <span style={{ fontSize: 8, fontWeight: 900, color: HP_TOKENS.sage }}>QUICK ADD</span>
            </button>
          </div>
          {linkedTasks.map((sg: any) => (
            <div 
              key={sg.id} 
              onClick={(e) => { e.stopPropagation(); toggleTask(sg.id); }}
              className="hp-tap"
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            >
              <div style={{ 
                width: 14, height: 14, borderRadius: 4, 
                background: sg.done ? toneColor : 'transparent',
                border: `1.5px solid ${sg.done ? toneColor : HP_TOKENS.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {sg.done && <HPGlyph name="check" size={8} color="#fff" stroke={4}/>}
              </div>
              <div style={{ 
                ...HP_TEXT.small, 
                fontSize: 12, 
                color: sg.done ? HP_TOKENS.inkFade : HP_TOKENS.ink,
                textDecoration: sg.done ? 'line-through' : 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {sg.title}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasTasks && (
        <div style={{ 
          marginTop: 12, padding: '10px 14px', 
          background: HP_TOKENS.yellowWash, borderRadius: 10,
          border: `1px dashed ${HP_TOKENS.yellow}60`,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <HPGlyph name="info" size={12} color={HP_TOKENS.yellow} />
          <div style={{ ...HP_TEXT.tiny, color: '#8A6814', fontWeight: 700, fontSize: 10 }}>
            Tambahkan task di Task Management & hubungkan ke OKR ini untuk tracking progress otomatis.
          </div>
        </div>
      )}
    </HPCard>
  );
}

