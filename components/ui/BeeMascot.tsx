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
      
      {/* Kawaii Bee Mascot */}
      <div style={{
        width: size,
        height: size,
        position: 'relative',
        animation: 'hpFloat 3s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Wings */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '30%',
          height: '40%',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '50% 50% 0 50%',
          transform: 'rotate(-20deg)',
          border: '1px solid #ddd'
        }} />
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '20%',
          width: '30%',
          height: '40%',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(20deg)',
          border: '1px solid #ddd'
        }} />

        {/* Body */}
        <div style={{
          width: '70%',
          height: '60%',
          background: '#FDB913',
          borderRadius: '40%',
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #333',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Stripes */}
          <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '15%', background: '#333' }} />
          <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: '15%', background: '#333' }} />
          
          {/* Face */}
          <div style={{ 
            display: 'flex', 
            gap: '20%', 
            zIndex: 2, 
            marginTop: '-5%',
            transition: 'all 0.3s'
          }}>
            <div style={{ width: 6, height: 6, background: '#333', borderRadius: '50%' }} />
            <div style={{ width: 6, height: 6, background: '#333', borderRadius: '50%' }} />
          </div>
          
          {/* Blush */}
          <div style={{ 
            display: 'flex', 
            gap: '40%', 
            zIndex: 2, 
            marginTop: 4
          }}>
            <div style={{ width: 4, height: 2, background: '#FFB6C1', borderRadius: '50%', opacity: 0.8 }} />
            <div style={{ width: 4, height: 2, background: '#FFB6C1', borderRadius: '50%', opacity: 0.8 }} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes hpFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hpFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
