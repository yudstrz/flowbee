"use client";

import React, { useState } from "react";
import { useHP } from "@/lib/HPContext";
import { 
  HP_TOKENS, 
  HP_FONT, 
  HP_TEXT 
} from "@/lib/constants";
import { 
  HP_PEOPLE, 
  HP_VALUES 
} from "@/lib/mockData";
import HPGlyph from "@/components/ui/HPGlyph";
import HPAvatar from "@/components/ui/HPAvatar";
import Modal from "@/components/ui/Modal";

interface AppreciateModalProps {
  onClose: () => void;
}

export default function AppreciateModal({ onClose }: AppreciateModalProps) {
  const { state, updateState, updateUser } = useHP();
  const [to, setTo] = useState<any>(null);
  const [value, setValue] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const send = () => {
    if (!to || !value || !msg || !state) return;

    const newFeedItem = {
      id: Date.now(), 
      from: 'Sari Wijaya', 
      to: to.name, 
      value, 
      msg, 
      likes: 0, 
      time: 'Baru saja',
    };

    updateState((s: any) => ({
      ...s,
      feed: [newFeedItem, ...s.feed],
      points: (s.points || 1340) + 5,
    }));

    updateUser((u: any) => ({
      ...u,
      points: (u.points || 1340) + 5,
    }));

    onClose();
  };

  if (!state) return null;

  return (
    <Modal onClose={onClose} title="Beri apresiasi">
      <div style={{ marginTop: 4 }}>
        <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700 }}>KE SIAPA</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {HP_PEOPLE.map((p: any) => (
            <button 
              key={p.name} 
              onClick={() => setTo(p)} 
              style={{
                padding: '10px 12px', 
                borderRadius: 14,
                background: to?.name === p.name ? HP_TOKENS.sage : HP_TOKENS.card,
                border: `1.5px solid ${to?.name === p.name ? HP_TOKENS.sage : HP_TOKENS.line}`,
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                cursor: 'pointer', 
                flexShrink: 0,
                fontFamily: HP_FONT,
              }}
              className="hp-tap"
            >
              <HPAvatar name={p.name} size={28}/>
              <div>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 800, 
                  color: to?.name === p.name ? '#fff' : HP_TOKENS.ink, 
                  textAlign: 'left' 
                }}>
                  {p.name.split(' ')[0]}
                </div>
                <div style={{ 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: to?.name === p.name ? 'rgba(255,255,255,0.8)' : HP_TOKENS.inkMute, 
                  textAlign: 'left' 
                }}>
                  {p.role}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, marginTop: 22 }}>NILAI PERUSAHAAN</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {HP_VALUES.map((v: string) => (
            <button 
              key={v} 
              onClick={() => setValue(v)} 
              style={{
                padding: '9px 14px', 
                borderRadius: 99,
                background: value === v ? HP_TOKENS.sage : HP_TOKENS.card,
                border: `1.5px solid ${value === v ? HP_TOKENS.sage : HP_TOKENS.line}`,
                color: value === v ? '#fff' : HP_TOKENS.ink,
                fontFamily: HP_FONT, 
                fontWeight: 700, 
                fontSize: 13, 
                cursor: 'pointer',
              }}
              className="hp-tap"
            >
              {v}
            </button>
          ))}
        </div>

        <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, marginTop: 22 }}>PESAN PERSONAL</div>
        <textarea
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          rows={4}
          placeholder="Apa yang kamu apresiasi, dan dampaknya ke tim?"
          style={{
            width: '100%', 
            marginTop: 10, 
            padding: 14, 
            borderRadius: 14,
            border: `1.5px solid ${HP_TOKENS.line}`, 
            fontFamily: HP_FONT, 
            fontSize: 14,
            color: HP_TOKENS.ink, 
            outline: 'none', 
            resize: 'none', 
            background: HP_TOKENS.card, 
            boxSizing: 'border-box',
          }}
        />
        <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, marginTop: 6 }}>
          💡 Apresiasimu akan muncul di feed tim — dapet 5 poin untuk kamu & 10 poin buat mereka.
        </div>

        <button 
          onClick={send} 
          disabled={!to || !value || !msg} 
          style={{
            width: '100%', 
            marginTop: 24, 
            padding: '16px', 
            borderRadius: 99,
            background: HP_TOKENS.sage, 
            color: '#fff', 
            border: 'none',
            fontFamily: HP_FONT, 
            fontWeight: 800, 
            fontSize: 15, 
            cursor: 'pointer',
            opacity: !to || !value || !msg ? 0.4 : 1,
            boxShadow: `0 4px 14px ${HP_TOKENS.sageSoft}`,
          }}
          className="hp-tap"
        >
          Kirim apresiasi 🌱
        </button>
      </div>
    </Modal>
  );
}

