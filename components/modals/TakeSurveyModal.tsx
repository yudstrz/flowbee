"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import HPGlyph from "@/components/ui/HPGlyph";
import { HP_TOKENS, HP_FONT } from "@/lib/constants";

interface TakeSurveyModalProps {
  onClose: () => void;
  survey: {
    title: string;
    url: string;
  };
}

import { useHP } from "@/lib/HPContext";

export default function TakeSurveyModal({ onClose, survey }: TakeSurveyModalProps) {
  const { awardXP } = useHP();

  const handleFinish = () => {
    awardXP('survey_complete', `Selesaikan survey: ${survey.title}`);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={survey.title}>
      <div style={{ 
        width: '100%', 
        height: '60vh', 
        marginTop: 10, 
        borderRadius: 16, 
        overflow: 'hidden',
        background: '#f0f0f0',
        position: 'relative'
      }}>
        <iframe 
          src={survey.url} 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          marginHeight={0} 
          marginWidth={0}
          title={survey.title}
        >
          Loading…
        </iframe>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        <a 
          href={survey.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 16, background: HP_TOKENS.blueSoft,
            color: HP_TOKENS.blue, textDecoration: 'none', fontFamily: HP_FONT,
            fontWeight: 800, fontSize: 14
          }}
          className="hp-tap"
        >
          <HPGlyph name="sparkle" size={16} color={HP_TOKENS.blue} />
          Buka di Tab Baru
        </a>

        <button
          onClick={handleFinish}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: HP_TOKENS.lavender, color: '#fff', border: 'none',
            fontFamily: HP_FONT, fontWeight: 800, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(123, 107, 181, 0.2)',
          }}
          className="hp-tap"
        >
          Saya sudah mengisi survey & Ambil 100 XP 🎁
        </button>
      </div>
    </Modal>
  );
}
