export interface ChildProfile {
  id: string; name: string; age: number; interests: string[]; avatarCharacterId: string | null;
}
export interface ReadingPlan {
  minutes: number; days: number[]; moment: string; time: string; timezone: string;
}
export interface Preferences {
  pendingActivities: boolean; readingSessions: boolean; motivation: boolean;
  muted: boolean; reducedMotion: boolean; largeText: boolean;
}
export interface Session {
  id: string; storyId: string; childProfileId: string; startedAt: string; finishedAt: string | null;
  activeDurationSeconds: number; status: 'Active' | 'Paused' | 'Completed'; lastSceneIndex: number;
}
export interface Progress {
  storyId: string; status: 'InProgress' | 'Completed'; lastSceneIndex: number;
  rating: 'LOVE' | 'LIKE' | 'NOT_FAVORITE' | null;
}
export interface Attempt {
  id: string; sessionId: string; activityId: string; status: 'Pending' | 'Completed'; tries: number; completedAt?: string | null;
}
export interface AppState {
  metrics?: { id: string; sessionId: string; kind: string; value: number; recordedAt: string }[];
  family: { id: string; activeChildId: string | null } | null;
  profiles: ChildProfile[]; child: ChildProfile | null; plan: ReadingPlan; preferences: Preferences;
  progress: Progress[]; sessions: Session[]; attempts: Attempt[];
  unlocks: { characterId: string; unlockedAt: string }[];
  favorites: string[];
  reminders: { id: string; type: string; message: string; dueAt: string; readAt: string | null }[];
}
export type ProfileInput = { name: string; age: number; interests: string[]; plan: ReadingPlan; preferences: Preferences };
export type Command =
  | { type: 'recordMetric'; sessionId: string; eventId: string; kind: 'InitialTip' | 'VoluntaryTip' | 'ActivityStarted' | 'ActivityTime'; value?: number }
  | { type: 'createProfile'; input: ProfileInput }
  | { type: 'updateProfile'; input: ProfileInput }
  | { type: 'switchProfile'; childId: string }
  | { type: 'startReading'; storyId: string; reread?: boolean }
  | { type: 'saveReading'; sessionId: string; sceneIndex: number; activeDurationSeconds: number; pause?: boolean }
  | { type: 'finishReading'; sessionId: string; activeDurationSeconds: number }
  | { type: 'deferActivity'; sessionId: string }
  | { type: 'completeActivity'; sessionId: string; order?: string[] }
  | { type: 'toggleFavorite'; storyId: string }
  | { type: 'selectAvatar'; characterId: string }
  | { type: 'rateStory'; storyId: string; rating: 'LOVE' | 'LIKE' | 'NOT_FAVORITE' }
  | { type: 'updatePreferences'; preferences: Preferences }
  | { type: 'readReminder'; reminderId: string };
export interface AppResponse { state: AppState; result?: { sessionId?: string; correct?: boolean } }
