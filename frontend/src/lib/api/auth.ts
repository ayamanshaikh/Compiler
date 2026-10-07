import { apiClient } from "./client";

export type UserRole = "ROLE_STUDENT" | "ROLE_INSTRUCTOR" | "ROLE_ADMIN";

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export type AccentColor = "emerald" | "indigo" | "cyan" | "amber" | "rose";
export type AnimationMode = "professional" | "balanced" | "enhanced";
export type VisualizationDetail = "compact" | "standard" | "detailed";
export type VisualDensity = "compact" | "comfortable";

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  fontSize: number;
  tabSize: number;
  explanationDepth: "BEGINNER" | "STANDARD" | "DETAILED";
  autoRunEnabled: boolean;
  visualizerSpeed: number;
  accent?: AccentColor;
  animationMode?: AnimationMode;
  lineWrapping?: boolean;
  minimap?: boolean;
  visualizationDetail?: VisualizationDetail;
  visualDensity?: VisualDensity;
}

export interface UserProgress {
  completedTopics: string[];
  solvedQuestions: string[];
  bookmarkedAlgorithms: string[];
  currentStreakDays: number;
  lastActiveAt?: string;
  completedTopicsCount: number;
  solvedQuestionsCount: number;
  bookmarkedAlgorithmsCount: number;
}

export interface UserProfileResponse {
  user: UserSummary;
  preferences: UserPreferences;
  progress: UserProgress;
  savedSnippetsCount: number;
}

export interface SavedSnippet {
  id: number;
  title: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const TOKEN_STORAGE_KEY = "codevista_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function registerUser(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/auth/register", { username, email, password });
  if (res.token) {
    setStoredToken(res.token);
  }
  return res;
}

export async function loginUser(usernameOrEmail: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/auth/login", { usernameOrEmail, password });
  if (res.token) {
    setStoredToken(res.token);
  }
  return res;
}

export async function fetchCurrentUser(): Promise<UserSummary> {
  return apiClient.get<UserSummary>("/auth/me");
}

export async function fetchUserProfile(): Promise<UserProfileResponse> {
  return apiClient.get<UserProfileResponse>("/user/profile");
}

export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  return apiClient.put<UserPreferences>("/user/preferences", preferences);
}

export async function updateTopicProgress(
  topicSlug: string,
  completed = true
): Promise<UserProfileResponse> {
  return apiClient.post<UserProfileResponse>("/user/progress/topic", { topicSlug, completed });
}

export async function updateQuestionProgress(
  questionId: string,
  solved = true
): Promise<UserProfileResponse> {
  return apiClient.post<UserProfileResponse>("/user/progress/question", { questionId, solved });
}

export async function updateAlgorithmBookmark(
  algorithmId: string,
  bookmarked = true
): Promise<UserProfileResponse> {
  return apiClient.post<UserProfileResponse>("/user/progress/algorithm", { algorithmId, bookmarked });
}

export async function fetchSavedSnippets(): Promise<SavedSnippet[]> {
  return apiClient.get<SavedSnippet[]>("/user/snippets");
}

export async function saveSnippet(
  title: string,
  code: string,
  description?: string
): Promise<SavedSnippet> {
  return apiClient.post<SavedSnippet>("/user/snippets", { title, code, description });
}

export async function deleteSnippet(snippetId: number): Promise<void> {
  return apiClient.delete<void>(`/user/snippets/${snippetId}`);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>("/user/password", { currentPassword, newPassword });
}
