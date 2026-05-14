"use client";

import React from "react";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="hp-shell" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      background: '#f0f2f5', // Background outside the app
      minHeight: '100vh'
    }}>
      {/* Main Content Container */}
      <div style={{ 
        position: 'relative', 
        height: '100vh', 
        width: '100%',
        maxWidth: '480px', // Standard mobile width for desktop view
        background: 'var(--hp-paper)', 
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

