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

interface ManageWeeklyModalProps {
  onClose: () => void;
}

export default function ManageWeeklyModal({ onClose }: ManageWeeklyModalProps) {
  const { state, updateState } = useHP();
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const addWeekly = () => {
    if (!newText) return;
    updateState((s: any) => ({
      ...s,
      weeklyPriorities: [
        ...(s.weeklyPriorities || []),
        { id: Date.now(), text: newText, done: false }
      ]
    }));
    setNewText("");
  };

  const deleteWeekly = (id: number) => {
    updateState((s: any) => ({
      ...s,
      weeklyPriorities: s.weeklyPriorities.filter((w: any) => w.id !== id)
    }));
  };

  const toggleWeekly = (id: number) => {
    updateState((s: any) => ({
      ...s,
      weeklyPriorities: s.weeklyPriorities.map((w: any) => 
        w.id === id ? { ...w, done: !w.done } : w
      )
    }));
  };

  const startEdit = (w: any) => {
    setEditingId(w.id);
    setEditText(w.text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateState((s: any) => ({
      ...s,
      weeklyPriorities: s.weeklyPriorities.map((w: any) => 
        w.id === editingId ? { ...w, text: editText } : w
      )
    }));
    setEditingId(null);
  };

  if (!state || !state.weeklyPriorities) return null;

  return (
    <Modal onClose={onClose} title="Weekly Priorities">
      <div style={{ marginTop: 4 }}>
        <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 800, marginBottom: 12, letterSpacing: '0.05em' }}>TARGET UTAMA MINGGU INI</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {state.weeklyPriorities.map((w: any) => (
            <div 
              key={w.id} 
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18,
                background: w.done ? HP_TOKENS.lineSoft : HP_TOKENS.card, 
                border: `1.5px solid ${w.done ? HP_TOKENS.line : HP_TOKENS.line}`,
                opacity: w.done ? 0.75 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {editingId === w.id ? (
                <>
                  <input 
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${HP_TOKENS.blue}`,
                      fontFamily: HP_FONT, fontSize: 14, outline: 'none'
                    }}
                  />
                  <button 
                    onClick={saveEdit}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    className="hp-tap"
                  >
                    <HPGlyph name="check" size={18} color={HP_TOKENS.sage}/>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => toggleWeekly(w.id)}
                    style={{ 
                      width: 24, height: 24, borderRadius: 8, 
                      background: w.done ? HP_TOKENS.sage : 'transparent',
                      border: `2px solid ${w.done ? HP_TOKENS.sage : HP_TOKENS.line}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    className="hp-tap"
                  >
                    {w.done && <HPGlyph name="check" size={12} color="#fff" stroke={3}/>}
                  </button>
                  <div style={{ 
                    flex: 1, ...HP_TEXT.body, fontSize: 14, fontWeight: 600, 
                    color: w.done ? HP_TOKENS.inkFade : HP_TOKENS.ink,
                    textDecoration: w.done ? 'line-through' : 'none'
                  }}>
                    {w.text}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      onClick={() => startEdit(w)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      className="hp-tap"
                    >
                      <HPGlyph name="refresh" size={16} color={HP_TOKENS.inkMute}/>
                    </button>
                    <button 
                      onClick={() => deleteWeekly(w.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      className="hp-tap"
                    >
                      <HPGlyph name="trash" size={16} color={HP_TOKENS.coral}/>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {state.weeklyPriorities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: HP_TOKENS.lineSoft, borderRadius: 18, border: `1.5px dashed ${HP_TOKENS.line}` }}>
              <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute }}>Belum ada prioritas mingguan.</div>
            </div>
          )}
        </div>

        <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 800, marginBottom: 12, letterSpacing: '0.05em' }}>TAMBAH RENCANA BARU</div>
        <div style={{ 
          display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', 
          borderRadius: 22, background: HP_TOKENS.blueWash, border: `1.5px solid ${HP_TOKENS.blueSoft}`
        }}>
          <input 
            type="text" 
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Apa fokus terpentingmu minggu ini?"
            style={{
              padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, background: '#fff', outline: 'none'
            }}
          />
          <button 
            onClick={addWeekly}
            disabled={!newText}
            style={{
              padding: '14px', borderRadius: 14, border: 'none',
              background: HP_TOKENS.blue, color: '#fff',
              fontFamily: HP_FONT, fontWeight: 800, fontSize: 15, cursor: 'pointer',
              opacity: !newText ? 0.5 : 1, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
            className="hp-tap"
          >
             <HPGlyph name="plus" size={16} color="#fff"/> Tambah ke Minggu Ini
          </button>
        </div>
      </div>
    </Modal>
  );
}
