"use client";

import React from "react";
import { useHP } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import { HP_MOODS } from "@/lib/mockData";
import Modal from "@/components/ui/Modal";
import HPGlyph from "@/components/ui/HPGlyph";

interface LogbookModalProps {
  onClose: () => void;
}

export default function LogbookModal({ onClose }: LogbookModalProps) {
  const { user } = useHP();
  const [logbook, setLogbook] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/logbook?userId=${user?.id}`);
        const data = await res.json();
        if (data.entries) setLogbook(data.entries);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchLogs();
  }, [user?.id]);

  return (
    <Modal onClose={onClose} title="Logbook Personal 📋">
      <div style={{ ...HP_TEXT.body, fontSize: 13, marginBottom: 20, color: HP_TOKENS.inkSoft }}>
        Riwayat aktivitas harian yang hanya bisa dilihat oleh kamu.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {logbook.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: HP_TOKENS.inkMute }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ ...HP_TEXT.h, fontSize: 16 }}>Logbook kosong.</div>
            <div style={{ ...HP_TEXT.body, fontSize: 14, marginTop: 4 }}>Selesaikan "Tutup Hari" untuk mengisi logbook.</div>
          </div>
        ) : (
          logbook.map((entry: any) => {
            if (entry.type === 'habit_completion') {
              return (
                <div key={entry.id} style={{
                  padding: 16, borderRadius: 20, background: HP_TOKENS.blueWash,
                  border: `1.5px solid ${HP_TOKENS.blueSoft}`, display: 'flex', alignItems: 'center', gap: 14
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HPGlyph name={entry.glyph || 'check'} size={28} color={HP_TOKENS.blue} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 13 }}>{entry.habitName} Selesai!</div>
                    <div style={{ ...HP_TEXT.small, fontSize: 11, color: HP_TOKENS.inkMute }}>
                      {entry.day}, {entry.date} · {entry.time}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '6px 12px', borderRadius: 12, background: HP_TOKENS.blue, 
                    color: '#fff', fontSize: 12, fontWeight: 900, boxShadow: `0 4px 10px ${HP_TOKENS.blueSoft}`
                  }}>
                    +{entry.points} Poin
                  </div>
                </div>
              );
            }

            if (entry.type === 'quest_completion') {
              return (
                <div key={entry.id} style={{
                  padding: 16, borderRadius: 20, background: HP_TOKENS.blueWash,
                  border: `1.5px solid ${HP_TOKENS.blueSoft}`, display: 'flex', alignItems: 'center', gap: 14
                }}>
                  <div style={{ 
                    width: 42, height: 42, borderRadius: 12, background: HP_TOKENS.blueSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <HPGlyph name="sparkle" size={20} color={HP_TOKENS.blue}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...HP_TEXT.h, fontSize: 13 }}>Daily Quest: {entry.title}</div>
                    <div style={{ ...HP_TEXT.small, fontSize: 11, color: HP_TOKENS.inkMute }}>
                      {entry.day}, {entry.date} · {entry.time}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '6px 12px', borderRadius: 12, background: HP_TOKENS.blue, 
                    color: '#fff', fontSize: 12, fontWeight: 900, boxShadow: `0 4px 10px ${HP_TOKENS.blueSoft}`
                  }}>
                    +{entry.points} Poin
                  </div>
                </div>
              );
            }



            if (entry.type === 'coaching_reflection') {
              return (
                <div key={entry.id} style={{
                  padding: 18, borderRadius: 24, background: HP_TOKENS.blueWash,
                  border: `1.5px solid ${HP_TOKENS.blueSoft}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HPGlyph name="people" size={24} color={HP_TOKENS.blue} />
                      </div>
                      <div>
                        <div style={{ ...HP_TEXT.h, fontSize: 13 }}>GROW Coaching Session</div>
                        <div style={{ ...HP_TEXT.small, fontSize: 11, color: HP_TOKENS.inkMute }}>
                          {entry.day}, {entry.date} · {entry.time}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '4px 10px', borderRadius: 8, background: HP_TOKENS.blue, 
                      color: '#fff', fontSize: 10, fontWeight: 900
                    }}>
                      +{entry.points} Poin
                    </div>
                  </div>
                  <div style={{ 
                    ...HP_TEXT.body, fontSize: 13, color: HP_TOKENS.ink, 
                    lineHeight: 1.5, background: 'rgba(255,255,255,0.5)', padding: 12, borderRadius: 12,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {entry.content}
                  </div>
                </div>
              );
            }

            const meta = JSON.parse(entry.metadata_json || '{}');
            const moodObj = HP_MOODS.find(m => m.key === meta.mood);
            return (
              <div key={entry.id} style={{
                padding: 18, borderRadius: 24, background: HP_TOKENS.card,
                border: `1.5px solid ${HP_TOKENS.line}`, position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HPGlyph name={moodObj?.glyph || 'activity'} size={24} color={HP_TOKENS.ink} />
                    </div>
                    <div>
                      <div style={{ ...HP_TEXT.h, fontSize: 13 }}>{new Date(entry.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                      <div style={{ ...HP_TEXT.small, fontSize: 11, color: HP_TOKENS.inkMute }}>Mood: {moodObj?.label || 'Unknown'} · {new Date(entry.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div style={{ 
                    padding: '6px 12px', borderRadius: 99, background: HP_TOKENS.blueWash, 
                    color: HP_TOKENS.blue, fontSize: 11, fontWeight: 900 
                  }}>
                    {meta.taskCount || 0} Task Selesai
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ ...HP_TEXT.small, fontWeight: 800, color: HP_TOKENS.coral, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>Hambatan</div>
                    <div style={{ ...HP_TEXT.body, fontSize: 13, marginTop: 2, color: meta.blockers ? HP_TOKENS.ink : HP_TOKENS.inkFade }}>
                      {meta.blockers || "Tidak ada hambatan."}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...HP_TEXT.small, fontWeight: 800, color: HP_TOKENS.blue, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>Catatan</div>
                    <div style={{ ...HP_TEXT.body, fontSize: 13, marginTop: 2, color: entry.content ? HP_TOKENS.ink : HP_TOKENS.inkFade }}>
                      {entry.content || "Tidak ada catatan."}
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.1 }}>
                  <HPGlyph name="book" size={40} color={HP_TOKENS.ink}/>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
