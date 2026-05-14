"use client";

import React, { useRef, useState } from "react";
import { useHP } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import HPGlyph from "@/components/ui/HPGlyph";

interface ProfileEditorModalProps {
  onClose: () => void;
}

export default function ProfileEditorModal({ onClose }: ProfileEditorModalProps) {
  const { user, updateUser, logout } = useHP();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(user?.avatarImage || null);
  const [name, setName] = useState(user?.name || "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateUser({ 
      name,
      ...(preview !== undefined ? { avatarImage: preview ?? undefined } : {})
    });
    onClose();
  };

  const handleRemove = () => {
    setPreview(null);
    updateUser({ avatarImage: undefined });
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Modal onClose={onClose} title="Profil & Pengaturan ⚙️">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginTop: 20 }}>
        
        {/* Preview Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 160, height: 160, borderRadius: 80,
            background: HP_TOKENS.lineSoft,
            border: `2px dashed ${HP_TOKENS.line}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', position: 'relative',
            transition: 'all 0.2s'
          }}
          className="hp-tap"
        >
          {preview ? (
            <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <HPGlyph name="refresh" size={32} color={HP_TOKENS.inkMute} />
              <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 700 }}>UPLOAD IMAGE</div>
            </div>
          )}
          
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
            background: 'rgba(0,0,0,0.4)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: HP_FONT, fontSize: 10, fontWeight: 800,
          }}>
            CLICK TO CHANGE
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />

        <div style={{ width: '100%' }}>
          <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkFade, fontWeight: 700, marginBottom: 6 }}>NAMA LENGKAP</div>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ketik nama Anda"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, fontWeight: 600, outline: 'none', background: HP_TOKENS.card
            }}
          />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            onClick={handleSave}
            style={{
              width: '100%', padding: '16px', borderRadius: 16,
              background: HP_TOKENS.yellow, color: HP_TOKENS.ink,
              border: 'none', fontFamily: HP_FONT, fontWeight: 800, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
            className="hp-tap"
          >
            <HPGlyph name="check" size={18} color={HP_TOKENS.ink} />
            <span>Simpan Perubahan</span>
          </button>

          {user?.avatarImage && (
            <button 
              onClick={handleRemove}
              style={{
                width: '100%', padding: '14px', borderRadius: 16,
                background: 'transparent', color: HP_TOKENS.coral,
                border: `1.5px solid ${HP_TOKENS.coral}40`, 
                fontFamily: HP_FONT, fontWeight: 700, fontSize: 14,
                cursor: 'pointer'
              }}
              className="hp-tap"
            >
              Hapus Foto & Reset ke Avatar
            </button>
          )}
        </div>

        <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, textAlign: 'center', lineHeight: 1.5 }}>
          Foto profil dan nama akan muncul di Dashboard, Goals, dan leaderboard tim.
        </div>

        <button 
          onClick={handleLogout}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, marginTop: 12,
            background: HP_TOKENS.coralSoft, color: HP_TOKENS.coral,
            border: `1.5px solid ${HP_TOKENS.coral}40`, 
            fontFamily: HP_FONT, fontWeight: 800, fontSize: 15,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}
          className="hp-tap"
        >
          <HPGlyph name="refresh" size={18} color={HP_TOKENS.coral} />
          Keluar (Logout)
        </button>
      </div>
    </Modal>
  );
}
