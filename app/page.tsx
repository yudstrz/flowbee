"use client";

import React, { useState, useCallback } from "react";
import { HPProvider, useHP, UserRole } from "@/lib/HPContext";
import { HP_TOKENS, HP_FONT } from "@/lib/constants";

// Auth
import AuthScreen from "@/components/auth/AuthScreen";
import OnboardingScreen from "@/components/auth/OnboardingScreen";

// UI
import HPGlyph from "@/components/ui/HPGlyph";
import TabNav from "@/components/layout/TabNav";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// ── Employee Screens ──
import HomeScreen from "@/components/home/HomeScreen";
import GoalsScreen from "@/components/goals/GoalsScreen";
import RecognizeScreen from "@/components/recognize/RecognizeScreen";
import GrowthScreen from "@/components/growth/GrowthScreen";
import WellbeingScreen from "@/components/wellbeing/WellbeingScreen";

// ── Manager Screens ──
import ManagerHomeScreen from "@/components/home/ManagerHomeScreen";
import ManagerGoalsScreen from "@/components/goals/ManagerGoalsScreen";
import ManagerRecognizeScreen from "@/components/recognize/ManagerRecognizeScreen";
import ManagerGrowthScreen from "@/components/growth/ManagerGrowthScreen";
import ManagerWellbeingScreen from "@/components/wellbeing/ManagerWellbeingScreen";

// ── HR Screens ──
import HRHomeScreen from "@/components/home/HRHomeScreen";
import HRPeopleScreen from "@/components/goals/HRPeopleScreen";
import HRRecognizeScreen from "@/components/recognize/HRRecognizeScreen";


// ── Admin Screens ──



// Modals
import CheckInModal from "@/components/modals/CheckInModal";
import FocusModal from "@/components/modals/FocusModal";

import PauseModal from "@/components/modals/PauseModal";
import ReflectModal from "@/components/modals/ReflectModal";
import CoachModal from "@/components/modals/CoachModal";
import NotificationsModal from "@/components/modals/NotificationsModal";

import GoalModal from "@/components/modals/GoalModal";
import WorkCheckInModal from "@/components/modals/WorkCheckInModal";
import ManagePrioritiesModal from "@/components/modals/ManagePrioritiesModal";
import ManageHabitsModal from "@/components/modals/ManageHabitsModal";
import ManageWeeklyModal from "@/components/modals/ManageWeeklyModal";
import ManageLearningModal from "@/components/modals/ManageLearningModal";
import ScheduleCoachingModal from "@/components/modals/ScheduleCoachingModal";
import GROWCoachingModal from "@/components/modals/GROWCoachingModal";
import LearningDetailModal from "@/components/modals/LearningDetailModal";
import ManageProgramsModal from "@/components/modals/ManageProgramsModal";
import AllRewardsModal from "@/components/modals/AllRewardsModal";

import LogbookModal from "@/components/modals/LogbookModal";
import SystemGuideModal from "@/components/modals/SystemGuideModal";
import SkillAssessmentModal from "@/components/modals/SkillAssessmentModal";
import ProfileEditorModal from "@/components/modals/ProfileEditorModal";
import ManageSurveysModal from "@/components/modals/ManageSurveysModal";
import TakeSurveyModal from "@/components/modals/TakeSurveyModal";
import AttendanceScannerModal from "@/components/modals/AttendanceScannerModal";
import OKRDictionaryModal from "@/components/modals/OKRDictionaryModal";
import ManageContactsModal from "@/components/modals/ManageContactsModal";


// ─── Role pill badge colors ──────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; glyph: string }> = {
  employee: { label: 'Employee', color: HP_TOKENS.yellow, bg: HP_TOKENS.yellowSoft, glyph: 'target' },
  manager:  { label: 'Manager',  color: HP_TOKENS.blue, bg: HP_TOKENS.blueSoft,  glyph: 'people' },
  hr:       { label: 'HR',       color: '#7B6BB5',       bg: '#EDE8F5',           glyph: 'medal' },
};

function AppContent() {
  const { state, loading, user, login, setUserRole, updateState } = useHP();
  const [tab, setTab] = useState('home');
  const [modal, setModal] = useState<{ name: string; props?: any } | null>(null);
  const [coachPos, setCoachPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = React.useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  const openModal  = useCallback((name: string, props?: any) => setModal({ name, props }), []);
  const closeModal = useCallback(() => setModal(null), []);

  // ── Loading splash ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: HP_TOKENS.paper }}>
      <div style={{ width: 40, height: 40, background: HP_TOKENS.yellow, borderRadius: 12, opacity: 0.6 }} />
    </div>
  );

  // ── Auth Check ─────────────────────────────────────────────────────────────
  if (!user) {
    return <AuthScreen onLogin={login} />;
  }

  // ── Onboarding ──
  if (state && !state.onboarded && user.role === 'employee') {
    return (
      <OnboardingScreen 
        userName={user.name} 
        onFinish={() => {
          updateState({ onboarded: true });
          openModal('checkin');
        }} 
      />
    );
  }

  // ── Determine Role (legacy 'admin' maps to 'hr') ─────────────────────────
  const rawRole = (user?.role || 'employee') as string;
  const currentRole: UserRole = rawRole === 'admin' ? 'hr' : rawRole as UserRole;
  const isManager = currentRole === 'manager';
  const isHR = currentRole === 'hr';

  // ── Render screen by role + tab ─────────────────────────────────────────────
  const pad = { paddingTop: 58 };

  const renderScreen = () => {
    // Employee
    if (currentRole === 'employee') {
      if (tab === 'home')      return <div style={pad}><HomeScreen tab={tab} openModal={openModal} /></div>;
      if (tab === 'goals')     return <div style={pad}><GoalsScreen openModal={openModal} /></div>;
      if (tab === 'recognize') return <div style={pad}><RecognizeScreen openModal={openModal} /></div>;
      if (tab === 'wellbeing') return <div style={pad}><WellbeingScreen openModal={openModal} /></div>;
    }
    // Manager
    if (currentRole === 'manager') {
      if (tab === 'home')      return <div style={pad}><ManagerHomeScreen openModal={openModal} /></div>;
      if (tab === 'goals')     return <div style={pad}><ManagerGoalsScreen openModal={openModal} /></div>;
      if (tab === 'recognize') return <div style={pad}><ManagerRecognizeScreen openModal={openModal} /></div>;
      if (tab === 'wellbeing') return <div style={pad}><ManagerWellbeingScreen openModal={openModal} /></div>;
    }
    // HR view
    if (currentRole === 'hr') {
      if (tab === 'home')      return <div style={pad}><HRHomeScreen openModal={openModal} /></div>;
      if (tab === 'goals')     return <div style={pad}><HRPeopleScreen openModal={openModal} /></div>;
      if (tab === 'recognize') return <div style={pad}><HRRecognizeScreen openModal={openModal} /></div>;
    }
    return null;
  };

  const meta = ROLE_META[currentRole];

  // ── Draggable Coach Button Handlers ──────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: coachPos.x,
      initialY: coachPos.y,
    };
    setIsDragging(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setIsDragging(true);
    }
    setCoachPos({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging && dragRef.current) {
      openModal('coach');
    }
    dragRef.current = null;
  };

  return (
    <div style={{ position: 'relative', height: '100%', background: HP_TOKENS.paper, overflow: 'hidden' }}>
      {/* Role pill — top right */}
      <div style={{
        position: 'absolute', top: 10, right: 14, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99,
            background: meta.bg,
            border: `1.5px solid ${meta.color}30`,
            fontFamily: HP_FONT, fontWeight: 800, fontSize: 11,
            color: meta.color,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <HPGlyph name={meta.glyph} size={11} color={meta.color} />
          <span>{meta.label}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        {renderScreen()}
      </div>

      {/* Floating AI Coach button - DRAGGABLE */}
      <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: 'absolute', 
            right: 18 - coachPos.x, 
            bottom: 106 - coachPos.y, 
            zIndex: 100, // High z-index to be above everything
            width: 56, height: 56, borderRadius: 28, border: 'none',
            background: currentRole === 'manager' ? HP_TOKENS.blue :
                       currentRole === 'hr' ? '#7B6BB5' :
                       HP_TOKENS.yellow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'pointer',
            touchAction: 'none', // Prevent scrolling while dragging
            boxShadow: `0 8px 24px ${
              currentRole === 'manager' ? 'rgba(59,111,160,0.4)' :
              currentRole === 'hr' ? 'rgba(123,107,181,0.4)' :
              'rgba(253,185,19,0.4)'
            }`,
            transition: 'transform 0.1s ease-out',
            transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <HPGlyph name="sparkle" size={26} color={currentRole === 'employee' ? HP_TOKENS.ink : "#fff"} />
        </button>

      <TabNav tab={tab} setTab={setTab} userRole={currentRole} />

      {/* Modal Renderer */}
      {modal?.name === 'checkin'          && <CheckInModal onClose={closeModal} />}
      {modal?.name === 'focus'            && <FocusModal onClose={closeModal} />}

      {modal?.name === 'pause'            && <PauseModal onClose={closeModal} />}
      {modal?.name === 'reflect'          && <ReflectModal onClose={closeModal} />}
      {modal?.name === 'coach'            && <CoachModal onClose={closeModal} />}
      {modal?.name === 'notifications'    && <NotificationsModal onClose={closeModal} />}

      {modal?.name === 'new_goal'         && <GoalModal onClose={closeModal} {...modal.props} />}
      {modal?.name === 'work_checkin'     && <WorkCheckInModal onClose={closeModal} {...modal.props} />}
      {modal?.name === 'manage_priorities'&& <ManagePrioritiesModal onClose={closeModal} {...modal.props} />}
      {modal?.name === 'manage_habits'    && <ManageHabitsModal onClose={closeModal} />}
      {modal?.name === 'manage_weekly'    && <ManageWeeklyModal onClose={closeModal} />}
      {modal?.name === 'manage_learning'  && <ManageLearningModal onClose={closeModal} />}
      {modal?.name === 'schedule_coaching'&& <ScheduleCoachingModal onClose={closeModal} />}
      {modal?.name === 'learning_detail'  && <LearningDetailModal onClose={closeModal} />}
      {modal?.name === 'manage_programs'  && <ManageProgramsModal onClose={closeModal} />}
      {modal?.name === 'all_rewards'      && <AllRewardsModal onClose={closeModal} />}
      {modal?.name === 'grow_coaching'    && <GROWCoachingModal onClose={closeModal} roleContext={modal.props?.role} topic={modal.props?.topic} />}
      {modal?.name === 'logbook'          && <LogbookModal onClose={closeModal} />}
      {modal?.name === 'system_guide'     && <SystemGuideModal onClose={closeModal} />}
      {modal?.name === 'profile_editor'   && <ProfileEditorModal onClose={closeModal} />}
      {modal?.name === 'manage_surveys'   && <ManageSurveysModal onClose={closeModal} {...modal.props} />}
      {modal?.name === 'take_survey'     && <TakeSurveyModal onClose={closeModal} {...modal.props} />}
      {modal?.name === 'skill_assessment' && <SkillAssessmentModal onClose={closeModal} skillName={modal.props?.skill} />}
      {modal?.name === 'attendance_scanner' && <AttendanceScannerModal onClose={closeModal} />}
      {modal?.name === 'okr_dictionary'   && <OKRDictionaryModal onClose={closeModal} />}
      {modal?.name === 'manage_contacts' && <ManageContactsModal onClose={closeModal} />}

    </div>
  );
}

export default function Home() {
  return (
    <HPProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </HPProvider>
  );
}
