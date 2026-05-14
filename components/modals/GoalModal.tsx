"use client";

import React, { useState } from "react";
import { useHP } from "@/lib/HPContext";
import { 
  HP_TOKENS, 
  HP_FONT, 
  HP_TEXT 
} from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import HPAvatar from "@/components/ui/HPAvatar";
import HPGlyph from "@/components/ui/HPGlyph";


interface GoalModalProps {
  onClose: () => void;
}

export default function GoalModal({ onClose, goal }: { onClose: () => void; goal?: any }) {
  const { state, updateState, user } = useHP();
  const [title, setTitle] = useState(goal?.title || "");
  const [due, setDue] = useState(goal?.due || "");
  const [scope, setScope] = useState(goal?.scope === 'assigned' ? 'employee' : (goal?.scope || "personal"));
  const [parentId, setParentId] = useState(goal?.parent_id || "");
  const [progress, setProgress] = useState(goal?.progress || 0);
  const [status, setStatus] = useState(goal?.status || 'pending');
  const [isKpi, setIsKpi] = useState(goal?.is_kpi || false);
  const [subGoals, setSubGoals] = useState<any[]>(goal?.subGoals || []);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const allEmployees = state?.hrData?.members || state?.managerData?.members || [];
  const filteredEmployees = allEmployees.filter((e: any) => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOwner = (id: string) => {
    setSelectedOwnerIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const refineWithAI = async () => {
    if (!title || isRefining) return;
    setIsRefining(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Refine this OKR title to be more professional, clear, and measurable: "${title}". Just give me the refined title string, no quotes or intro.`,
          systemPrompt: "You are a professional OKR coach. Your goal is to make OKRs clear and measurable."
        })
      });
      const data = await res.json();
      if (data.text) setTitle(data.text.replace(/"/g, '').trim());
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  const generateStrategyWithAI = async () => {
    if (!title || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `For the goal: "${title}", suggest: 
          1. A refined professional title.
          2. 3-4 specific milestones/sub-tasks.
          3. A realistic deadline based on today's date (${new Date().toISOString()}).
          Format as JSON: {"refinedTitle": "...", "tasks": [{"title": "...", "done": false}], "suggestedDeadline": "YYYY-MM-DDTHH:mm"}`,
          systemPrompt: "You are an OKR and Project Management specialist. Output ONLY valid JSON."
        })
      });
      const data = await res.json();
      if (data.text) {
        const jsonMatch = data.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          setTitle(result.refinedTitle);
          setSubGoals(result.tasks);
          setDue(result.suggestedDeadline);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async () => {
    if (!title || !due) return;
    
    // Format due date for display if it's ISO
    let displayDue = due;
    try {
      const d = new Date(due);
      if (!isNaN(d.getTime())) {
        displayDue = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + " " + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}

    if (goal) {
      // Update existing goal
      updateState((s: any) => ({
        ...s,
        goals: s.goals.map((g: any) => {
          if (String(g.id) === String(goal.id)) {
            // Recalculate progress from linked tasks
            const tasksForGoal = s.priorities?.filter((p: any) => p.goal_id && String(p.goal_id) === String(goal.id)) || [];
            const doneCount = tasksForGoal.filter((p: any) => p.done).length;
            const newProgress = tasksForGoal.length > 0 
              ? Math.round((doneCount / tasksForGoal.length) * 100) 
              : progress;

            return {
              ...g,
              title,
              due: displayDue,
              dueISO: due,
              scope: scope === 'employee' ? 'assigned' : scope,
              parent_id: parentId || null,
              progress: newProgress,
              status: status,
              is_kpi: isKpi || g.is_kpi,
              metric: tasksForGoal.length > 0 ? `${doneCount}/${tasksForGoal.length} task selesai` : g.metric,
              subGoals: subGoals.length > 0 ? subGoals : g.subGoals,
            };
          }
          return g;
        })
      }));
    } else {
      // Create new
      const creators = scope === 'employee' ? selectedOwnerIds : [user?.id];
      
      const newEntries = creators.map((ownerId, idx) => {
        const emp = allEmployees.find((e: any) => String(e.id) === String(ownerId));
        return {
          id: Date.now() + idx,
          title,
          progress: progress,
          alignment: 100,
          owner: emp?.name || user?.name || "You",
          ownerId: ownerId,
          assignedById: scope === 'employee' ? user?.id : null,
          due: displayDue,
          dueISO: due,
          tone: scope === 'personal' ? "sage" : scope === 'team' ? "blue" : scope === 'employee' ? "lavender" : "yellow",
          metric: "0% complete",
          scope: scope === 'employee' ? 'assigned' : scope,
          parent_id: parentId || null,
          status: 'pending',
          is_kpi: scope === 'employee' || scope === 'team',
          subGoals: subGoals.length > 0 ? subGoals : undefined
        };
      });

      updateState((s: any) => ({
        ...s,
        goals: [
          ...s.goals,
          ...newEntries
        ]
      }));
    }

    onClose();
  };

  const scopes = [
    { key: 'personal', label: 'Personal', desc: 'Hanya untuk progres kamu', icon: 'sparkle' },
    (user?.role === 'manager' || user?.role === 'hr') && { key: 'employee', label: 'Assign', desc: 'Berikan OKR ke anggota tim', icon: 'people' },
    (user?.role === 'manager' || user?.role === 'hr') && { key: 'team', label: 'Team', desc: 'Target bersama satu divisi', icon: 'target' },
    (user?.role === 'hr') && { key: 'company', label: 'Company', desc: 'Visi besar organisasi', icon: 'leaf' },
  ].filter(Boolean) as any[];

  const parentOptions = state?.goals.filter((g: any) => {
    if (scope === 'personal') return g.scope === 'team' || g.scope === 'company';
    if (scope === 'team') return g.scope === 'company';
    return false;
  }) || [];

  return (
    <Modal onClose={onClose} title={goal ? "Edit OKR" : "Set Strategi OKR"}>
      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, letterSpacing: 0.5 }}>JUDUL STRATEGI</div>
            <textarea 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="Apa yang ingin dicapai? (Misal: Ekspansi pasar ke SEA)"
              rows={2}
              style={{
                width: '100%', marginTop: 8, padding: 14, borderRadius: 16,
                border: `1.5px solid ${HP_TOKENS.line}`, fontFamily: HP_FONT, fontSize: 15,
                color: HP_TOKENS.ink, outline: 'none', background: HP_TOKENS.card, boxSizing: 'border-box',
                resize: 'none', lineHeight: 1.4
              }}
            />
          </div>
          <button 
            onClick={generateStrategyWithAI}
            disabled={!title || isGenerating}
            className="hp-tap"
            style={{
              marginTop: 24, padding: '12px', borderRadius: 16, background: `linear-gradient(135deg, ${HP_TOKENS.blue}, #2D5A9E)`,
              border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: !title || isGenerating ? 0.5 : 1, gap: 4, width: 64, height: 64, flexShrink: 0,
              boxShadow: `0 8px 16px ${HP_TOKENS.blueSoft}`
            }}
          >
            {isGenerating ? (
              <div className="hp-spin" style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              <>
                <HPGlyph name="sparkle" size={20} color="#fff" />
                <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>AI WIZARD</span>
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700 }}>TENGGAT WAKTU (DEADLINE)</div>
            <input 
              type="datetime-local" 
              value={due} 
              onChange={e => setDue(e.target.value)}
              style={{
                width: '100%', marginTop: 8, padding: 14, borderRadius: 16,
                border: `1.5px solid ${HP_TOKENS.line}`, fontFamily: HP_FONT, fontSize: 14,
                color: HP_TOKENS.ink, outline: 'none', background: HP_TOKENS.card, boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700 }}>PROGRESS MANUAL (%)</div>
            <div style={{ ...HP_TEXT.h, fontSize: 16, color: HP_TOKENS.sage }}>{progress}%</div>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={e => setProgress(parseInt(e.target.value))}
            style={{
              width: '100%', marginTop: 12, accentColor: HP_TOKENS.sage, cursor: 'pointer'
            }}
          />
          {state?.priorities?.some((p: any) => p.goal && p.goal === title) && (
            <div style={{ 
              marginTop: 8, padding: '8px 12px', background: HP_TOKENS.yellowWash, 
              borderRadius: 10, border: `1px solid ${HP_TOKENS.yellow}40`,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <HPGlyph name="info" size={12} color={HP_TOKENS.yellow} />
              <div style={{ ...HP_TEXT.tiny, color: '#8A6814', fontWeight: 700, fontSize: 10 }}>
                Progress akan otomatis terupdate berdasarkan task yang terhubung.
              </div>
            </div>
          )}
        </div>

        {subGoals.length > 0 && (
          <div style={{ 
            marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, 
            background: HP_TOKENS.paper, padding: 14, borderRadius: 18, border: `1px dashed ${HP_TOKENS.line}`
          }}>
            <div style={{ ...HP_TEXT.tiny, color: HP_TOKENS.inkMute, fontWeight: 900, letterSpacing: 0.5 }}>MILESTONES / KEY RESULTS</div>
            {subGoals.map((sg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${HP_TOKENS.line}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sg.done && <HPGlyph name="check" size={10} color={HP_TOKENS.sage} />}
                </div>
                <div style={{ ...HP_TEXT.small, fontSize: 13, color: HP_TOKENS.inkSoft, fontWeight: 600 }}>{sg.title}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>PILIH SCOPE OKR</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {scopes.map(s => (
            <button
              key={s.key}
              onClick={() => { setScope(s.key); setParentId(""); }}
              className="hp-tap"
              style={{
                padding: '14px', borderRadius: 16, border: `1.5px solid ${scope === s.key ? HP_TOKENS.ink : HP_TOKENS.lineSoft}`,
                background: scope === s.key ? HP_TOKENS.ink : '#fff',
                color: scope === s.key ? '#fff' : HP_TOKENS.ink,
                fontFamily: HP_FONT, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HPGlyph name={s.icon} size={18} color={scope === s.key ? '#fff' : HP_TOKENS.inkMute} />
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{s.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{s.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {scope === 'employee' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, marginBottom: 10 }}>ASSIGN KE ANGGOTA ({selectedOwnerIds.length})</div>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', 
              background: '#fff', borderRadius: 16, border: `1.5px solid ${HP_TOKENS.line}`,
              marginBottom: 12
            }}>
              <HPGlyph name="target" size={16} color={HP_TOKENS.inkMute} />
              <input 
                placeholder="Cari nama atau posisi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: HP_FONT, fontSize: 14 }}
              />
            </div>
            <div style={{ 
              display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10, 
              scrollbarWidth: 'none'
            }}>
              {filteredEmployees.map((e: any) => {
                const active = selectedOwnerIds.includes(e.id);
                return (
                  <div 
                    key={e.id} 
                    onClick={() => toggleOwner(e.id)}
                    className="hp-tap"
                    style={{ 
                      flexShrink: 0, width: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      opacity: active ? 1 : 0.5, transition: '0.2s', cursor: 'pointer'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <HPAvatar name={e.name} size={48} color={active ? HP_TOKENS.blue : undefined} />
                      {active && (
                        <div style={{ 
                          position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10,
                          background: HP_TOKENS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}>
                          <HPGlyph name="check" size={10} color="#fff" stroke={4} />
                        </div>
                      )}
                    </div>
                    <div style={{ ...HP_TEXT.tiny, textAlign: 'center', fontSize: 10, fontWeight: 800 }}>
                      {e.name.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {parentOptions.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...HP_TEXT.small, color: HP_TOKENS.inkMute, fontWeight: 700, letterSpacing: 0.5 }}>HUBUNGKAN KE PARENT OKR</div>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              style={{
                width: '100%', marginTop: 8, padding: 14, borderRadius: 16,
                border: `1.5px solid ${HP_TOKENS.line}`, fontFamily: HP_FONT, fontSize: 14,
                color: HP_TOKENS.ink, outline: 'none', background: HP_TOKENS.card, boxSizing: 'border-box',
              }}
            >
              <option value="">-- Berdiri Sendiri --</option>
              {parentOptions.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title} ({p.scope})</option>
              ))}
            </select>
          </div>
        )}

        <button 
          onClick={save} 
          disabled={!title || !due || (scope === 'employee' && selectedOwnerIds.length === 0)}
          style={{
            width: '100%', marginTop: 32, padding: '18px', borderRadius: 99,
            background: HP_TOKENS.sage, color: '#fff', border: 'none',
            fontFamily: HP_FONT, fontWeight: 900, fontSize: 16, cursor: 'pointer',
            opacity: (!title || !due || (scope === 'employee' && selectedOwnerIds.length === 0)) ? 0.4 : 1,
            boxShadow: `0 10px 25px ${HP_TOKENS.sageSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}
          className="hp-tap"
        >
          <HPGlyph name="sparkle" size={20} color="#fff" />
          {scope === 'employee' ? `Assign OKR ke ${selectedOwnerIds.length} Orang` : 'Simpan & Publikasikan OKR'}
        </button>
      </div>
    </Modal>
  );
}

