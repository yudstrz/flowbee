"use client";

import React, { useState } from "react";
import { useHP } from "@/lib/HPContext";
import { 
  HP_TOKENS, 
  HP_FONT, 
  HP_TEXT 
} from "@/lib/constants";
import HPGlyph from "@/components/ui/HPGlyph";
import Modal from "@/components/ui/Modal";

export default function ManagePrioritiesModal({ onClose, initialGoal }: { onClose: () => void; initialGoal?: string }) {
  const { state, updateState } = useHP();
  const [newTitle, setNewTitle] = useState("");
  const [energy, setEnergy] = useState("mid");
  const [type, setType] = useState("Daily Task");
  const [points, setPoints] = useState<number>(50);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(initialGoal || state?.goals?.[0]?.id || "General");

  if (!state) return null;

  const addPriority = () => {
    if (!newTitle) return;
    const selectedGoal = state.goals.find((g: any) => String(g.id) === String(selectedGoalId));
    const newP = {
      id: Date.now(),
      title: newTitle,
      goal: selectedGoal?.title || '',
      goal_id: selectedGoal?.id || null,
      energy: energy,
      type: type,
      est: "30m",
      done: false,
      points: Number(points) || 50,
      tone: energy === 'high' ? 'yellow' : energy === 'mid' ? 'sage' : 'blue',
    };
    updateState((s: any) => {
      const newPriorities = [...s.priorities, newP];
      
      // Recalculate goal progress with the new task included
      let updatedGoals = s.goals;
      if (newP.goal_id && s.goals) {
        updatedGoals = s.goals.map((g: any) => {
          if (String(g.id) === String(newP.goal_id)) {
            const tasksForGoal = newPriorities.filter((p: any) => p.goal_id && String(p.goal_id) === String(g.id));
            const doneCount = tasksForGoal.filter((p: any) => p.done).length;
            const newProgress = tasksForGoal.length > 0 
              ? Math.round((doneCount / tasksForGoal.length) * 100) 
              : g.progress;
            return { ...g, progress: newProgress, metric: `${doneCount}/${tasksForGoal.length} task selesai` };
          }
          return g;
        });
      }

      return {
        ...s,
        priorities: newPriorities,
        goals: updatedGoals,
      };
    });
    setNewTitle("");
    setPoints(50);
  };

  const deletePriority = (id: number) => {
    updateState((s: any) => {
      const deletedTask = s.priorities.find((p: any) => p.id === id);
      const newPriorities = s.priorities.filter((p: any) => p.id !== id);
      
      // Recalculate goal progress after removing the task
      let updatedGoals = s.goals;
      if (deletedTask?.goal_id && s.goals) {
        updatedGoals = s.goals.map((g: any) => {
          if (String(g.id) === String(deletedTask.goal_id)) {
            const tasksForGoal = newPriorities.filter((p: any) => p.goal_id && String(p.goal_id) === String(g.id));
            const doneCount = tasksForGoal.filter((p: any) => p.done).length;
            const newProgress = tasksForGoal.length > 0 
              ? Math.round((doneCount / tasksForGoal.length) * 100) 
              : g.progress;
            return { 
              ...g, 
              progress: newProgress, 
              metric: tasksForGoal.length > 0 ? `${doneCount}/${tasksForGoal.length} task selesai` : 'Realisasi' 
            };
          }
          return g;
        });
      }

      return {
        ...s,
        priorities: newPriorities,
        goals: updatedGoals,
      };
    });
  };

  return (
    <Modal onClose={onClose} title="Kelola Quest">
      <div style={{ marginTop: 4 }}>
        <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 12 }}>QUEST AKTIF</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {state.priorities.map((p: any) => (
            <div 
              key={p.id} 
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16,
                background: HP_TOKENS.card, border: `1.5px solid ${HP_TOKENS.line}`,
              }}
            >
              <div style={{ 
                width: 24, height: 24, borderRadius: 12, 
                background: p.done ? HP_TOKENS.sage : 'transparent',
                border: `1.5px solid ${p.done ? HP_TOKENS.sage : HP_TOKENS.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {p.done && <HPGlyph name="check" size={12} color="#fff"/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...HP_TEXT.body, fontSize: 14, fontWeight: 600, color: p.done ? HP_TOKENS.inkFade : HP_TOKENS.ink }}>
                  {p.title}
                </div>
                <div style={{ ...HP_TEXT.small, fontSize: 11, color: HP_TOKENS.inkMute, marginTop: 2 }}>
                  {p.type} · {p.energy.toUpperCase()} Priority
                </div>
              </div>
              <div style={{ 
                padding: '4px 10px', borderRadius: 8, background: HP_TOKENS.blueWash, 
                color: HP_TOKENS.blue, fontSize: 10, fontWeight: 900 
              }}>
                +{p.points || 50} Poin
              </div>
              <button 
                onClick={() => deletePriority(p.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <HPGlyph name="close" size={16} color={HP_TOKENS.coral}/>
              </button>
            </div>
          ))}
        </div>

        <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 12 }}>TAMBAH QUEST BARU</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 20, background: HP_TOKENS.sageWash }}>
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Apa yang ingin kamu selesaikan?"
            style={{
              padding: 14, borderRadius: 12, border: `1.5px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, background: '#fff', outline: 'none'
            }}
          />
          
          <div style={{ ...HP_TEXT.small, fontSize: 11, fontWeight: 700, color: HP_TOKENS.inkMute }}>Pilih Goal (OKR Terkait)</div>
          <select 
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            style={{
              padding: 14, borderRadius: 12, border: `1.5px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, background: '#fff', outline: 'none'
            }}
          >
            <option value="General">General / Tidak Spesifik</option>
            {state.goals?.map((g: any) => (
              <option key={g.id} value={g.id}>{g.title} ({g.scope})</option>
            ))}
          </select>

          <div style={{ ...HP_TEXT.small, fontSize: 11, fontWeight: 700, color: HP_TOKENS.inkMute }}>Poin / EXP (Reward)</div>
          <input 
            type="number" 
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
            placeholder="50"
            style={{
              padding: 14, borderRadius: 12, border: `1.5px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, background: '#fff', outline: 'none'
            }}
          />

          <div style={{ ...HP_TEXT.small, fontSize: 11, fontWeight: 700, color: HP_TOKENS.inkMute }}>Tipe Quest</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Daily Task', 'Manager Task', 'Division Goal'].map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, 
                  background: type === t ? HP_TOKENS.sage : '#fff',
                  color: type === t ? '#fff' : HP_TOKENS.ink,
                  fontFamily: HP_FONT, fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  transition: '0.2s', border: `1px solid ${type === t ? HP_TOKENS.sage : HP_TOKENS.line}`
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ ...HP_TEXT.small, fontSize: 11, fontWeight: 700, color: HP_TOKENS.inkMute }}>Prioritas / Energi</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['low', 'mid', 'high'].map(e => (
              <button
                key={e}
                onClick={() => setEnergy(e)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  background: energy === e ? HP_TOKENS.ink : '#fff',
                  color: energy === e ? '#fff' : HP_TOKENS.ink,
                  fontFamily: HP_FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  transition: '0.2s', border: `1px solid ${energy === e ? HP_TOKENS.ink : HP_TOKENS.line}`
                }}
              >
                {e.toUpperCase()}
              </button>
            ))}
          </div>

          <button 
            onClick={addPriority}
            disabled={!newTitle}
            style={{
              marginTop: 4, padding: 14, borderRadius: 12, border: 'none',
              background: HP_TOKENS.sage, color: '#fff',
              fontFamily: HP_FONT, fontWeight: 800, fontSize: 15, cursor: 'pointer',
              opacity: !newTitle ? 0.5 : 1
            }}
          >
            Tambah Ke Quest
          </button>
        </div>
      </div>
    </Modal>
  );
}
