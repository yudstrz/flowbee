"use client";

import React, { useState, useEffect } from "react";
import { HP_TOKENS, HP_FONT, HP_TEXT } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import HPGlyph from "@/components/ui/HPGlyph";
import { useHP } from "@/lib/HPContext";

interface DepartmentManagerModalProps {
  onClose: () => void;
}

export default function DepartmentManagerModal({ onClose }: DepartmentManagerModalProps) {
  const { user } = useHP();
  const [departments, setDepartments] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDepts = async () => {
    const res = await fetch("/api/admin/departments");
    const data = await res.json();
    if (data.departments) setDepartments(data.departments);
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, requesterId: user?.id })
      });
      if (res.ok) {
        setNewName("");
        fetchDepts();
      } else {
        alert("Gagal menambah departemen.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus kategori departemen ini?")) return;
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterId: user?.id })
    });
    if (res.ok) fetchDepts();
  };

  return (
    <Modal onClose={onClose} title="Kelola Departemen 🏢">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
        
        {/* Add Form */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            placeholder="Nama Departemen Baru..." 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            style={{
              flex: 1, padding: '14px', borderRadius: 16, border: `1.5px solid ${HP_TOKENS.line}`,
              fontFamily: HP_FONT, fontSize: 14, fontWeight: 700, outline: 'none', background: '#fff'
            }} 
          />
          <button 
            onClick={handleAdd}
            disabled={loading}
            className="hp-tap"
            style={{
              padding: '0 20px', borderRadius: 16, background: HP_TOKENS.ink, color: '#fff',
              border: 'none', fontFamily: HP_FONT, fontWeight: 800, cursor: 'pointer'
            }}
          >
            {loading ? "..." : "Tambah"}
          </button>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
          {departments.map(d => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 14, background: HP_TOKENS.paper,
              border: `1px solid ${HP_TOKENS.lineSoft}`
            }}>
              <span style={{ ...HP_TEXT.small, fontWeight: 800, color: HP_TOKENS.ink }}>{d.name}</span>
              <button 
                onClick={() => handleDelete(d.id)}
                className="hp-tap"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <HPGlyph name="trash" size={16} color={HP_TOKENS.coral} />
              </button>
            </div>
          ))}
          {departments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: HP_TOKENS.inkMute }}>Belum ada departemen.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
