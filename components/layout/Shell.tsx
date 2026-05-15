"use client";

import React from "react";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="hp-shell min-h-screen bg-gray-100 flex justify-center">
      {/* Main Content Container */}
      <div className="relative w-full max-w-md bg-white h-screen shadow-[0_0_40px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Scrollable Area */}
        <div className="absolute inset-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

