"use client";

import React, { useState, useEffect } from "react";
import { useHP } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import HPGlyph from "@/components/ui/HPGlyph";

interface ManageSurveysModalProps {
  onClose: () => void;
  editId?: number;
}

export default function ManageSurveysModal({ onClose, editId }: ManageSurveysModalProps) {
  const { state, refreshSurveys } = useHP();
  
  // Find the survey if editId is provided
  const initialSurvey = editId ? state?.surveys?.find((s: any) => s.id === editId) : null;

  const [title, setTitle] = useState(initialSurvey?.title || "");
  const [url, setUrl] = useState(initialSurvey?.url || "");
  const [editingId, setEditingId] = useState<number | null>(editId || null);
  const [saving, setSaving] = useState(false);

  // Always load fresh data from DB when modal opens
  useEffect(() => { refreshSurveys(); }, []);

  const saveSurvey = async () => {
    if (!title || !url) return;
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/hr/surveys', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, title, url, status: 'active' })
      });
      if (res.ok) {
        setTitle("");
        setUrl("");
        setEditingId(null);
        await refreshSurveys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteSurvey = async (id: number) => {
    if (!confirm("Hapus survey ini?")) return;
    try {
      const res = await fetch(`/api/hr/surveys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshSurveys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (sr: any) => {
    setEditingId(sr.id);
    setTitle(sr.title);
    setUrl(sr.url);
  };

  const surveys = state?.surveys ?? [];

  return (
    <Modal onClose={onClose} title="Kelola HR Surveys 📋">
      <div style={{ marginTop: 4 }}>
        <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 800, marginBottom: 12, letterSpacing: '0.05em' }}>SURVEY AKTIF</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {surveys.map((sr: any) => (
            <div 
              key={sr.id} 
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18,
                background: HP_TOKENS.card, border: `1.5px solid ${HP_TOKENS.line}`,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: HP_TOKENS.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HPGlyph name="book" size={20} color={HP_TOKENS.blue} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...HP_TEXT.h, fontSize: 14 }}>{sr.title}</div>
                <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, marginTop: 2 }}>
                  Diterbitkan {new Date(sr.publishedAt).toLocaleDateString('id-ID')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => startEdit(sr)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  className="hp-tap"
                >
                  <HPGlyph name="sparkle" size={16} color={HP_TOKENS.blue}/>
                </button>
                <button 
                  onClick={() => deleteSurvey(sr.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  className="hp-tap"
                >
                  <HPGlyph name="trash" size={16} color={HP_TOKENS.coral}/>
                </button>
              </div>
            </div>
          ))}
          {surveys.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: HP_TOKENS.lineSoft, borderRadius: 18, border: `1.5px dashed ${HP_TOKENS.line}` }}>
              <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute }}>Belum ada survey yang diterbitkan.</div>
            </div>
          )}
        </div>

        <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 800, marginBottom: 12, letterSpacing: '0.05em' }}>
          {editingId ? "EDIT SURVEY" : "TERBITKAN SURVEY BARU"}
        </div>
        <div style={{ 
          display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', 
          borderRadius: 22, background: HP_TOKENS.lavenderSoft, border: `1.5px solid ${HP_TOKENS.lavender}20`
        }}>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul Survey (e.g. Employee Engagement Q2)"
            style={{
              padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, background: '#fff', outline: 'none'
            }}
          />
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link Google Form (Embed URL)"
            style={{
              padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, background: '#fff', outline: 'none'
            }}
          />
          <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, padding: '0 4px', fontSize: 10 }}>
            Tips: Gunakan link yang sudah di-shorten atau link Google Form langsung.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={saveSurvey}
              disabled={!title || !url || saving}
              style={{
                flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                background: HP_TOKENS.lavender, color: '#fff',
                fontFamily: HP_FONT, fontWeight: 800, fontSize: 15, cursor: 'pointer',
                opacity: (!title || !url || saving) ? 0.5 : 1, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
              className="hp-tap"
            >
               <HPGlyph name={editingId ? "sparkle" : "plus"} size={16} color="#fff"/> {saving ? "Menyimpan..." : (editingId ? "Update Survey" : "Terbitkan Survey")}
            </button>
            {editingId && (
              <button 
                onClick={() => { setEditingId(null); setTitle(""); setUrl(""); }}
                style={{
                  padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${HP_TOKENS.line}`,
                  background: '#fff', color: HP_TOKENS.inkSoft,
                  fontFamily: HP_FONT, fontWeight: 800, fontSize: 15, cursor: 'pointer'
                }}
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
