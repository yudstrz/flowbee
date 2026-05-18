"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface HPState {
  mood: string | null;
  energy: string | null;
  tag: string | null;
  intention: string;
  priorities: any[];
  feed: any[];
  goals: any[];
  habits: any[];
  surveys: any[];
  skills: any[];
  learning: any[];
  coaching: any;
  wellbeing: any;
  points: number;
  coins: number;
  notifications: number;
  rewards: any[];
  rewardHistory: any[];
  logbook: any[];
  lastActivityDate: string | null;
  penaltyActive: boolean;
  penaltyThresholdDays: number;
  workSchedule: {
    start: string;
    end: string;
    breakStart: string;
    breakEnd: string;
    midDayCheckInTime: string;
  };
  todayAttendance?: {
    checkIn?: string;
    checkOut?: string;
  };
  personalWellbeingGoal?: string;
  wellbeingRoutine?: Array<{ id: string; title: string; done: boolean }>;
  contacts: Array<{ id: string; name: string; role: string; email: string; phone: string; isPrivate?: boolean }>;
  hrData?: any;
  managerData?: any;
  onboarded?: boolean;
  focusTaskId?: number | null;
  focusProgress?: number;
  notificationPermission?: NotificationPermission;
}

export type UserRole = 'hr' | 'manager' | 'employee';

interface HPUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  streak: number;
  points: number;
  coins: number;
  level: number;
  rank: string;
  userRole?: UserRole | null;
  avatarImage?: string;
}

interface HPContextType {
  state: HPState | null;
  user: HPUser | null;
  updateState: (update: Partial<HPState> | ((prev: HPState) => HPState)) => void;
  updateUser: (update: Partial<HPUser> | ((prev: HPUser) => HPUser)) => void;
  setUserRole: (role: UserRole) => void;
  login: (userData: any) => void;
  logout: () => void;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshSurveys: () => Promise<void>;
  resetData: () => Promise<void>;
  syncSkillProgress: (source: string, amount: number) => void;
  awardXP: (actionType: string, description?: string) => Promise<void>;
  toasts: any[];
  notify: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error', native?: boolean) => void;
  dismissToast: (id: string) => void;
  requestNotificationPermission: () => Promise<boolean>;
  sendNativeNotification: (title: string, body?: string) => void;
}

const HPContext = createContext<HPContextType | undefined>(undefined);

// ── Helpers (Moved outside to keep hooks order stable) ───────────────────────
const calculateLevel = (points: number) => {
  if (points < 1000) return Math.floor(points / 100) + 1;
  if (points < 4000) return 10 + Math.floor((points - 1000) / 300) + 1;
  return 20 + Math.floor((points - 4000) / 1000) + 1;
};

const calculateRank = (level: number) => {
  if (level <= 10) return 'E';
  if (level <= 20) return 'D';
  if (level <= 35) return 'C';
  if (level <= 50) return 'B';
  if (level <= 70) return 'A';
  return 'S';
};

export function HPProvider({ children }: { children: React.ReactNode }) {
  // 1. ALL STATES FIRST
  const [state, setState] = useState<HPState | null>(null);
  const [user, setUser] = useState<HPUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<any[]>([]);

  // 2. REFS
  const userRef = useRef<HPUser | null>(null);

  // 3. CALLBACKS
  const updateState = useCallback((update: Partial<HPState> | ((prev: HPState) => HPState)) => {
    setState((prev) => {
      if (!prev) return null;
      if (typeof update === "function") return update(prev);
      return { ...prev, ...update };
    });
  }, []);

  const updateUser = useCallback((update: Partial<HPUser> | ((prev: HPUser) => HPUser)) => {
    setUser((prev) => {
      if (!prev) return null;
      let next = typeof update === "function" ? update(prev) : { ...prev, ...update };
      if (next.points !== prev.points) {
        const newLevel = calculateLevel(next.points);
        const newRank = calculateRank(newLevel);
        next = { ...next, level: newLevel, rank: newRank };
      }
      return next;
    });
  }, []);

  const notify = useCallback((title: string, message?: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', native: boolean = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);

    if (native && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/icon.png'
        });
      }
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    updateState({ notificationPermission: permission });
    return permission === 'granted';
  }, [updateState]);

  const sendNativeNotification = useCallback((title: string, body?: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.png'
      });
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/storage?userId=${userId}`);
      const data = await res.json();
      if (data.error) throw new Error(`${data.error}: ${data.details || ''}`);
      if (data.state) setState(data.state);
      else {
        setState({
          mood: null, energy: null, tag: null, intention: "",
          priorities: [], feed: [], goals: [], habits: [],
          surveys: [], skills: [], learning: [], coaching: null, wellbeing: { dims: [], programs: [] },
          points: data.user?.points || 0, coins: data.user?.coins || 0, notifications: 0, 
          rewards: [], rewardHistory: [],
          logbook: [], lastActivityDate: new Date().toISOString(),
          penaltyActive: false, penaltyThresholdDays: 3,
          workSchedule: { start: "08:00", end: "17:00", breakStart: "12:00", breakEnd: "13:00", midDayCheckInTime: "12:00" },
          contacts: [],
          onboarded: false,
          focusTaskId: null,
          focusProgress: 0,
          notificationPermission: (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'denied'
        });
      }
      if (data.user) setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch state:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData: any) => {
    setUser(userData);
    localStorage.setItem("hp_user_id", userData.id);
    fetchData(userData.id);
  }, [fetchData]);

  const logout = useCallback(() => {
    setUser(null);
    setState(null);
    localStorage.removeItem("hp_user_id");
  }, []);

  const fetchDashboards = useCallback(async (userId: string, role: string) => {
    try {
      if (role === 'hr') {
        const res = await fetch('/api/hr/dashboard');
        const data = await res.json();
        if (data && data.metrics) {
          setState(prev => prev ? { ...prev, hrData: data } : null);
        }
      } else if (role === 'manager') {
        const res = await fetch(`/api/manager/dashboard?userId=${userId}`);
        const data = await res.json();
        setState(prev => prev ? { ...prev, managerData: data } : null);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, userRole: role };
    });
  }, []);

  const syncSkillProgress = useCallback((source: string, amount: number) => {
    setState((prev) => {
      if (!prev) return null;
      let targetSkill = "";
      const s = source.toLowerCase();
      if (s.includes("design system") || s.includes("component") || s.includes("token")) targetSkill = "Design Systems";
      else if (s.includes("user") || s.includes("research") || s.includes("insight") || s.includes("interview")) targetSkill = "User Research";
      else if (s.includes("interaction") || s.includes("prototype") || s.includes("flow") || s.includes("wireframe") || s.includes("hi-fi")) targetSkill = "Interaction Design";
      else if (s.includes("lead") || s.includes("mentor") || s.includes("manager") || s.includes("strategic")) targetSkill = "Leadership";
      else if (s.includes("story") || s.includes("present") || s.includes("pitch") || s.includes("narrative")) targetSkill = "Storytelling";
      else if (s.trim().length > 0) {
        const words = s.split(' ');
        targetSkill = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      } else {
        targetSkill = "General";
      }
      const newSkills = [...(prev.skills || [])];
      const skillIndex = newSkills.findIndex(sk => sk.name.toLowerCase() === targetSkill.toLowerCase());
      if (skillIndex > -1) {
        newSkills[skillIndex] = { ...newSkills[skillIndex], current: Math.min(100, newSkills[skillIndex].current + amount) };
      } else {
        newSkills.push({ name: targetSkill, current: amount, target: 100 });
      }
      return { ...prev, skills: newSkills };
    });
  }, []);

  const resetData = useCallback(async () => {
    setLoading(true);
    window.location.reload();
  }, []);

  const refreshSurveys = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/surveys');
      const data = await res.json();
      if (data.surveys) {
        setState(prev => prev ? { ...prev, surveys: data.surveys } : null);
      }
    } catch (e) {
      console.error("Failed to refresh surveys:", e);
    }
  }, []);

  const awardXP = useCallback(async (actionType: string, description?: string) => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      const res = await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, actionType, description }),
      });
      const data = await res.json();
      if (data.success) {
        updateUser({ points: data.newTotal, coins: data.newCoins });
        updateState((s: any) => ({ ...s, points: data.newTotal, coins: data.newCoins }));
      }
    } catch (e) {
      console.error("Failed to award XP:", e);
    }
  }, [updateUser, updateState]);

  const refresh = useCallback(async () => {
    if (userRef.current?.id) await fetchData(userRef.current.id);
  }, [fetchData]);

  // 4. ALL EFFECTS AT THE END
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const savedUserId = localStorage.getItem("hp_user_id");
    if (savedUserId) fetchData(savedUserId);
    else setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    if (user) {
      const activeRole = user.userRole || user.role;
      if (activeRole === 'hr' || activeRole === 'manager') {
        fetchDashboards(user.id, activeRole);
      }
    }
  }, [user, fetchDashboards]);

  useEffect(() => {
    if (user?.id && !loading) {
      fetch('/api/hr/surveys')
        .then(r => r.json())
        .then(data => {
          if (data.surveys) setState(prev => prev ? { ...prev, surveys: data.surveys } : null);
        })
        .catch(() => {});
    }
  }, [user?.id, loading]);

  // Auto-sync to DB with debounce + keepalive (survives page refresh)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSyncRef = useRef<{ state: any; user: any } | null>(null);

  useEffect(() => {
    if (!loading && user && state) {
      // Store latest data for sync
      latestSyncRef.current = { state, user };

      // Debounce: wait 500ms after last state change before syncing (reduced from 800ms)
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(async () => {
        const data = latestSyncRef.current;
        if (!data) return;
        
        try {
          setSyncing(true);
          // Optimize payload: remove huge/redundant data before sending to server
          const syncState = { ...data.state };
          delete syncState.hrData;
          delete syncState.managerData;
          delete syncState.surveys;
          delete syncState.feed;
          delete syncState.rewards; // Server handles its own rewards fetching for non-HR
          
          // Strip massive avatarImage to keep regular state sync light
          const syncUser = { ...data.user };
          delete syncUser.avatarImage;
          
          const response = await fetch("/api/storage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: syncState, user: syncUser, userId: data.user.id }),
            // Removed keepalive: true for regular syncs to avoid 64KB limit
          });
          
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Sync failed:", errData.error || response.statusText);
            // Optionally notify user on persistent failure
          }
        } catch (e) {
          console.error("Sync error:", e);
        } finally {
          setSyncing(false);
        }
      }, 500);
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state, user, loading]);

  // Also sync immediately on page unload (backup) with stripped payload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = latestSyncRef.current;
      if (data) {
        try {
          const syncState = { ...data.state };
          delete syncState.hrData;
          delete syncState.managerData;
          delete syncState.surveys;
          delete syncState.feed;
          delete syncState.rewards;

          // Strip massive avatarImage to keep regular state sync light
          const syncUser = { ...data.user };
          delete syncUser.avatarImage;

          const payload = JSON.stringify({ state: syncState, user: syncUser, userId: data.user.id });
          // Only send if within beacon limits (usually 64KB)
          if (payload.length < 60000) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/storage', blob);
          }
        } catch (e) {
          // silent fallback
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <HPContext.Provider value={{ 
      state, user, updateState, updateUser, setUserRole, login, logout, awardXP,
      loading, refresh,
      refreshSurveys, resetData, syncSkillProgress,
      toasts, notify, dismissToast,
      requestNotificationPermission, sendNativeNotification
    }}>
      {children}
    </HPContext.Provider>
  );
}

export function useHP() {
  const context = useContext(HPContext);
  if (context === undefined) throw new Error("useHP must be used within a HPProvider");
  return context;
}
