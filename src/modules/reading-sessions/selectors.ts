import type { AppState } from '@/core/contracts';
import { stories } from '@/modules/content/types';

/** A reading in progress has priority, then the library's next unread story. No date gate. */
export function recommendStory(state: AppState | null) {
  const progress = state?.progress ?? [];
  return stories.find(story => progress.some(p => p.storyId === story.id && p.status === 'InProgress'))
    ?? stories.find(story => !progress.some(p => p.storyId === story.id && p.status === 'Completed'))
    ?? stories[0];
}
export function pendingActivities(state: AppState | null) {
  return state?.attempts.filter(attempt => attempt.status === 'Pending' && state.sessions.some(session => session.id === attempt.sessionId && session.status === 'Completed')) ?? [];
}
export function dueReminders(state: AppState | null, now = new Date()) {
  return state?.reminders.filter(reminder => !reminder.readAt && new Date(reminder.dueAt) <= now) ?? [];
}
