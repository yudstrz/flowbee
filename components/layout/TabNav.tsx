"use client";

import React from "react";
import { HP_TOKENS, HP_FONT } from "@/lib/constants";
import { UserRole } from "@/lib/HPContext";
import HPGlyph from "@/components/ui/HPGlyph";

interface TabNavProps {
  tab: string;
  setTab: (tab: string) => void;
  userRole?: UserRole | null;
}

const TAB_CONFIG: Record<UserRole, Array<{ key: string; label: string; icon: string }>> = {
  employee: [
    { key: 'home',      label: 'Home',       icon: 'home' },
    { key: 'goals',     label: 'Goals',      icon: 'target' },
    { key: 'recognize', label: 'Rewards',    icon: 'trophy' },
    { key: 'wellbeing', label: 'Wellbeing',  icon: 'leaf' },
  ],
  manager: [
    { key: 'home',      label: 'Dashboard',  icon: 'home' },
    { key: 'goals',     label: 'Tim & OKR',  icon: 'target' },
    { key: 'recognize', label: 'Rewards',    icon: 'trophy' },
    { key: 'wellbeing', label: 'Wellbeing',  icon: 'leaf' },
  ],
  hr: [
    { key: 'home',      label: 'Dashboard',  icon: 'home' },
    { key: 'goals',     label: 'People',     icon: 'people' },
    { key: 'recognize', label: 'Rewards',    icon: 'trophy' },
  ],
};

export default function TabNav({ tab, setTab, userRole }: TabNavProps) {
  const tabs = TAB_CONFIG[userRole ?? 'employee'];

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 25,
      padding: '12px 16px 28px',
      background: HP_TOKENS.paper,
      borderTop: `1px solid ${HP_TOKENS.line}`,
      display: 'flex',
      justifyContent: 'space-around',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            color: tab === t.key ? HP_TOKENS.yellow : HP_TOKENS.inkMute,
            fontFamily: HP_FONT,
            fontWeight: 800,
            fontSize: 10,
            transition: 'all 200ms ease',
            position: 'relative',
          }}
        >
          <HPGlyph
            name={t.icon}
            size={20}
            color={tab === t.key ? HP_TOKENS.yellow : HP_TOKENS.inkMute}
            stroke={tab === t.key ? 2.5 : 2}
          />
          <div style={{ opacity: tab === t.key ? 1 : 0.7 }}>{t.label}</div>
        </button>
      ))}
    </div>
  );
}
