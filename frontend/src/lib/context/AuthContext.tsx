"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  UserSummary,
  UserProfileResponse,
  UserPreferences,
  UserProgress,
  getStoredToken,
  clearStoredToken,
  fetchUserProfile,
  loginUser,
  registerUser,
  updateUserPreferences,
  updateTopicProgress,
  updateQuestionProgress,
  updateAlgorithmBookmark,
} from "../api/auth";
import { themeStore } from "./ThemeContext";

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  fontSize: 14,
  tabSize: 4,
  explanationDepth: "BEGINNER",
  autoRunEnabled: false,
  visualizerSpeed: 600,
  accent: "emerald",
  animationMode: "balanced",
  lineWrapping: true,
  minimap: false,
  visualizationDetail: "standard",
  visualDensity: "comfortable",
};

const DEFAULT_PROGRESS: UserProgress = {
  completedTopics: [],
  solvedQuestions: [],
  bookmarkedAlgorithms: [],
  currentStreakDays: 1,
  completedTopicsCount: 0,
  solvedQuestionsCount: 0,
  bookmarkedAlgorithmsCount: 0,
};

const GUEST_PREFS_KEY = "codevista_guest_preferences";
const GUEST_PROGRESS_KEY = "codevista_guest_progress";

interface AuthContextType {
  user: UserSummary | null;
  profile: UserProfileResponse | null;
  preferences: UserPreferences;
  progress: UserProgress;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  markTopicCompleted: (topicSlug: string, completed?: boolean) => Promise<void>;
  markQuestionSolved: (questionId: string | number, solved?: boolean) => Promise<void>;
  toggleAlgorithmBookmark: (algorithmId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getGuestPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(GUEST_PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function setGuestPreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_PREFS_KEY, JSON.stringify(prefs));
}

function getGuestProgress(): UserProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    const completedTopics = Array.isArray(parsed.completedTopics) ? parsed.completedTopics : [];
    const solvedQuestions = Array.isArray(parsed.solvedQuestions) ? parsed.solvedQuestions : [];
    const bookmarkedAlgorithms = Array.isArray(parsed.bookmarkedAlgorithms)
      ? parsed.bookmarkedAlgorithms
      : [];
    return {
      completedTopics,
      solvedQuestions,
      bookmarkedAlgorithms,
      currentStreakDays: parsed.currentStreakDays || 1,
      lastActiveAt: parsed.lastActiveAt,
      completedTopicsCount: completedTopics.length,
      solvedQuestionsCount: solvedQuestions.length,
      bookmarkedAlgorithmsCount: bookmarkedAlgorithms.length,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function setGuestProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const loadUserData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setPreferences(getGuestPreferences());
      setProgress(getGuestProgress());
      setIsLoading(false);
      return;
    }

    try {
      const profileData = await fetchUserProfile();
      setUser(profileData.user);
      setProfile(profileData);
      setPreferences(profileData.preferences);
      setProgress(profileData.progress);
      if (profileData.preferences.theme) {
        themeStore.setTheme(profileData.preferences.theme);
      }
      if (profileData.preferences.accent) {
        themeStore.setAccent(profileData.preferences.accent);
      }
      if (profileData.preferences.animationMode) {
        themeStore.setAnimationMode(profileData.preferences.animationMode);
      }
    } catch {
      // Invalid/expired token
      clearStoredToken();
      setUser(null);
      setProfile(null);
      setPreferences(getGuestPreferences());
      setProgress(getGuestProgress());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      await loadUserData();
      if (!isMounted) return;
    };
    initialize();
    return () => {
      isMounted = false;
    };
  }, [loadUserData]);

  const login = async (usernameOrEmail: string, password: string) => {
    await loginUser(usernameOrEmail, password);
    await loadUserData();
    setIsAuthModalOpen(false);
  };

  const register = async (username: string, email: string, password: string) => {
    await registerUser(username, email, password);
    await loadUserData();
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    setProfile(null);
    setPreferences(getGuestPreferences());
    setProgress(getGuestProgress());
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const data = await fetchUserProfile();
      setProfile(data);
      setPreferences(data.preferences);
      setProgress(data.progress);
      if (data.preferences.theme) {
        themeStore.setTheme(data.preferences.theme);
      }
      if (data.preferences.accent) {
        themeStore.setAccent(data.preferences.accent);
      }
      if (data.preferences.animationMode) {
        themeStore.setAnimationMode(data.preferences.animationMode);
      }
    } catch {
      // ignore
    }
  };

  const updatePreferencesHandler = async (newPrefs: Partial<UserPreferences>) => {
    if (newPrefs.theme) {
      themeStore.setTheme(newPrefs.theme);
    }
    if (newPrefs.accent) {
      themeStore.setAccent(newPrefs.accent);
    }
    if (newPrefs.animationMode) {
      themeStore.setAnimationMode(newPrefs.animationMode);
    }
    if (user) {
      const updated = await updateUserPreferences(newPrefs);
      setPreferences(updated);
    } else {
      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);
      setGuestPreferences(updated);
    }
  };

  const markTopicCompleted = async (topicSlug: string, completed = true) => {
    if (user) {
      const updatedProfile = await updateTopicProgress(topicSlug, completed);
      setProfile(updatedProfile);
      setProgress(updatedProfile.progress);
    } else {
      const current = getGuestProgress();
      const set = new Set(current.completedTopics);
      if (completed) {
        set.add(topicSlug);
      } else {
        set.delete(topicSlug);
      }
      const updatedList = Array.from(set);
      const updatedProgress: UserProgress = {
        ...current,
        completedTopics: updatedList,
        completedTopicsCount: updatedList.length,
        lastActiveAt: new Date().toISOString(),
      };
      setProgress(updatedProgress);
      setGuestProgress(updatedProgress);
    }
  };

  const markQuestionSolved = async (questionId: string | number, solved = true) => {
    const qId = String(questionId);
    if (user) {
      const updatedProfile = await updateQuestionProgress(qId, solved);
      setProfile(updatedProfile);
      setProgress(updatedProfile.progress);
    } else {
      const current = getGuestProgress();
      const set = new Set(current.solvedQuestions);
      if (solved) {
        set.add(qId);
      } else {
        set.delete(qId);
      }
      const updatedList = Array.from(set);
      const updatedProgress: UserProgress = {
        ...current,
        solvedQuestions: updatedList,
        solvedQuestionsCount: updatedList.length,
        lastActiveAt: new Date().toISOString(),
      };
      setProgress(updatedProgress);
      setGuestProgress(updatedProgress);
    }
  };

  const toggleAlgorithmBookmark = async (algorithmId: string) => {
    const isCurrentlyBookmarked = progress.bookmarkedAlgorithms.includes(algorithmId);
    const nextState = !isCurrentlyBookmarked;

    if (user) {
      const updatedProfile = await updateAlgorithmBookmark(algorithmId, nextState);
      setProfile(updatedProfile);
      setProgress(updatedProfile.progress);
    } else {
      const current = getGuestProgress();
      const set = new Set(current.bookmarkedAlgorithms);
      if (nextState) {
        set.add(algorithmId);
      } else {
        set.delete(algorithmId);
      }
      const updatedList = Array.from(set);
      const updatedProgress: UserProgress = {
        ...current,
        bookmarkedAlgorithms: updatedList,
        bookmarkedAlgorithmsCount: updatedList.length,
        lastActiveAt: new Date().toISOString(),
      };
      setProgress(updatedProgress);
      setGuestProgress(updatedProgress);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        progress,
        isAuthenticated: !!user,
        isGuest: !user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshProfile,
        updatePreferences: updatePreferencesHandler,
        markTopicCompleted,
        markQuestionSolved,
        toggleAlgorithmBookmark,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
