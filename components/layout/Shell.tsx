"use client";

import React from "react";
import { HP_TOKENS } from "@/lib/constants";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F3F4F6', // bg-gray-100
      display: 'flex',
      justifyContent: 'center',
      width: '100%'
    }}>
      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '448px', // max-w-md
        backgroundColor: HP_TOKENS.paper, // bg-white/paper
        height: '100vh',
        boxShadow: '0 0 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Scrollable Area */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

