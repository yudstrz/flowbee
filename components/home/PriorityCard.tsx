"use client";

import React, { useState } from "react";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import HPGlyph from "@/components/ui/HPGlyph";

interface PriorityCardProps {
  p: any;
  onToggle: () => void;
}

export default function PriorityCard({ p, onToggle }: PriorityCardProps) {
  const [showPoints, setShowPoints] = useState(false);

  const toneMap: Record<string, any> = {
    sage: { bg: HP_TOKENS.yellowSoft, fg: HP_TOKENS.ink, wash: HP_TOKENS.yellowWash },
    blue: { bg: HP_TOKENS.blueSoft, fg: HP_TOKENS.blue, wash: HP_TOKENS.blueWash },
    lavender: { bg: HP_TOKENS.lavenderSoft, fg: '#6B5F8E', wash: HP_TOKENS.lavenderSoft },
  };
  
  const t = toneMap[p.tone] || toneMap.sage;
  const energyIcon = p.energy === 'high' ? 'zap' : p.energy === 'mid' ? 'activity' : 'sparkle';

  const handleToggle = () => {
    if (!p.done) {
      setShowPoints(true);
      setTimeout(() => setShowPoints(false), 1200);
    }
    onToggle();
  };
  
  return (
    <div style={{
      position: 'relative',
      display: 'flex', 
      alignItems: 'center', 
      gap: 16, 
      padding: '18px',
      background: p.done ? HP_TOKENS.card : '#fff',
      border: `1.5px solid ${p.done ? HP_TOKENS.line : HP_TOKENS.line}`,
      borderRadius: 20, 
      boxShadow: p.done ? 'none' : '0 4px 12px rgba(0,0,0,0.02)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {/* Floating +50 Poin */}
      {showPoints && (
        <div style={{
          position: 'absolute', top: -10, right: 20,
          background: HP_TOKENS.ink, color: HP_TOKENS.yellow,
          fontSize: 10, fontWeight: 900, fontFamily: HP_FONT,
          padding: '4px 10px', borderRadius: 10,
          animation: 'hpRise 1.2s ease-out forwards',
          pointerEvents: 'none', zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          +{p.points || 50} EXP
        </div>
      )}

      <button 
        onClick={handleToggle} 
        className="hp-tap" 
        style={{
          width: 28, 
          height: 28, 
          borderRadius: 10, 
          border: `2.5px solid ${p.done ? t.bg : HP_TOKENS.line}`,
          background: p.done ? t.bg : 'transparent', 
          cursor: 'pointer', 
          flexShrink: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 0,
          transition: '0.2s'
        }}
      >
        {p.done && <HPGlyph name="check" size={16} color={t.fg} stroke={4}/>}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          ...HP_TEXT.h, 
          fontSize: 15,
          textDecoration: p.done ? 'line-through' : 'none',
          color: p.done ? HP_TOKENS.inkFade : HP_TOKENS.ink,
          lineHeight: 1.4,
          fontWeight: 700
        }}>
          {p.title}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
           {p.goal && (
             <div style={{ 
               display: 'flex', alignItems: 'center', gap: 4, 
               background: p.done ? HP_TOKENS.lineSoft : `${t.wash}80`, 
               padding: '2px 8px', borderRadius: 6 
             }}>
               <HPGlyph name="target" size={10} color={p.done ? HP_TOKENS.inkMute : t.fg} />
               <span style={{ 
                 ...HP_TEXT.tiny, 
                 color: p.done ? HP_TOKENS.inkMute : t.fg, 
                 fontWeight: 800,
                 fontSize: 10
               }}>
                 {p.goal}
               </span>
             </div>
           )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HPGlyph name={energyIcon} size={11} color={HP_TOKENS.inkMute} />
            <span style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700 }}>
              {p.est}
            </span>
          </div>
        </div>
      </div>

      <div style={{ 
        width: 32, height: 32, borderRadius: 16, background: HP_TOKENS.paper,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
         <HPGlyph name="arrow" size={14} color={HP_TOKENS.line} />
      </div>
    </div>
  );
}
