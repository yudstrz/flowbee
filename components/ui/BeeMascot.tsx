"use client";

import React from "react";
import { HP_TOKENS } from "@/lib/constants";

interface BeeMascotProps {
  mood?: 'happy' | 'neutral' | 'sad' | 'sleepy' | 'surprised';
  size?: number;
  showSpeech?: string;
}

export default function BeeMascot({ mood = 'happy', size = 80, showSpeech }: BeeMascotProps) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {showSpeech && (
        <div style={{
          marginBottom: 12,
          padding: '10px 16px',
          borderRadius: '16px 16px 16px 4px',
          background: '#fff',
          border: `1.5px solid ${HP_TOKENS.line}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          maxWidth: 200,
          position: 'relative',
          animation: 'hpFadeIn 0.3s ease-out'
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: HP_TOKENS.ink }}>{showSpeech}</div>
          <div style={{
            position: 'absolute',
            bottom: -8,
            left: 8,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${HP_TOKENS.line}`
          }} />
        </div>
      )}
      
      <div style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.8,
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        🐝
      </div>

      <style jsx global>{`
        @keyframes hpFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
