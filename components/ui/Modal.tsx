"use client";

import React from "react";
import { HP_TOKENS, HP_TEXT } from "@/lib/constants";
import HPGlyph from "@/components/ui/HPGlyph";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  dark?: boolean;
}

const iconBtnStyle: React.CSSProperties = {
  position: 'relative', 
  width: 40, 
  height: 40, 
  borderRadius: 20, 
  border: 'none',
  background: 'transparent', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  cursor: 'pointer',
};

export default function Modal({ children, onClose, title, dark }: ModalProps) {
  return (
    <div 
      onClick={onClose} 
      style={{
        position: 'absolute', 
        inset: 0, 
        zIndex: 100,
        background: 'rgba(44,42,40,0.45)', 
        backdropFilter: 'blur(4px)',
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center',
        animation: 'hpFadeIn 250ms ease',
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{
          width: '100%', 
          maxHeight: '92%', 
          background: dark ? HP_TOKENS.ink : HP_TOKENS.paper,
          borderTopLeftRadius: 32, 
          borderTopRightRadius: 32,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          animation: 'hpSlideUp 350ms cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div style={{ padding: '10px 16px 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: 36, 
            height: 4, 
            borderRadius: 2, 
            background: dark ? 'rgba(255,255,255,0.2)' : HP_TOKENS.inkFade 
          }}/>
        </div>
        {title && (
          <div style={{ padding: '8px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ ...HP_TEXT.title, fontSize: 20, color: dark ? '#fff' : HP_TOKENS.ink }}>{title}</div>
            <button 
              onClick={onClose} 
              style={{ 
                ...iconBtnStyle, 
                background: dark ? 'rgba(255,255,255,0.1)' : HP_TOKENS.lineSoft 
              }}
            >
              <HPGlyph name="close" size={18} color={dark ? '#fff' : HP_TOKENS.inkSoft}/>
            </button>
          </div>
        )}
        {!title && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
            <button 
              onClick={onClose} 
              style={{ 
                ...iconBtnStyle, 
                background: dark ? 'rgba(255,255,255,0.1)' : HP_TOKENS.lineSoft 
              }}
            >
              <HPGlyph name="close" size={18} color={dark ? '#fff' : HP_TOKENS.inkSoft}/>
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 30px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
