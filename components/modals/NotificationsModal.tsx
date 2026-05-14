"use client";

import React from "react";
import { 
  HP_TOKENS, 
  HP_TEXT 
} from "@/lib/constants";
import Modal from "@/components/ui/Modal";

interface NotificationsModalProps {
  onClose: () => void;
}

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const notifs = [
    { icon: '🌤️', title: 'Hei, bagaimana perasaanmu hari ini?', time: '15m', tone: 'sage' },
    { icon: '🎉', title: 'Budi baru aja kasih kamu apresiasi', sub: 'Collaboration · "Handoff-mu super jelas..."', time: '2j', tone: 'yellow' },
    { icon: '☕', title: 'Sudah 3 jam kerja keras — butuh istirahat sebentar?', time: '3j', tone: 'blue' },
    { icon: '💬', title: 'Kamu belum memberi feedback ke Andi minggu ini', time: 'kemarin', tone: 'lavender' },
    { icon: '🌱', title: 'Streak check-in 12 hari! Keep going 🎯', time: 'kemarin', tone: 'sage' },
  ];

  return (
    <Modal onClose={onClose} title="Notifikasi">
      <div style={{ ...HP_TEXT.body, fontSize: 13, color: HP_TOKENS.inkMute, marginBottom: 14, fontStyle: 'italic' }}>
        Tone empatik, bukan reminder kaku. Kamu bisa atur frekuensi di Settings.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifs.map((n, i) => (
          <div 
            key={i} 
            style={{
              display: 'flex', 
              gap: 12, 
              padding: 14, 
              borderRadius: 16,
              background: HP_TOKENS.card, 
              border: `1px solid ${HP_TOKENS.line}`,
            }}
          >
            <div style={{ fontSize: 24 }}>{n.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...HP_TEXT.h, fontSize: 14 }}>{n.title}</div>
              {n.sub && (
                <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkSoft, marginTop: 3, fontWeight: 600 }}>
                  {n.sub}
                </div>
              )}
              <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, marginTop: 4 }}>
                {n.time} lalu
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
