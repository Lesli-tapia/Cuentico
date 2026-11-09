import { z } from 'zod';

const identifier = z.string().min(1).max(100);
export const preferencesSchema = z.object({
  pendingActivities: z.boolean(), readingSessions: z.boolean(), motivation: z.boolean(),
  muted: z.boolean(), reducedMotion: z.boolean(), largeText: z.boolean()
}).strict();
export const planSchema = z.object({
  minutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7).refine(days => new Set(days).size === days.length),
  moment: z.enum(['mañana', 'mediodía', 'tarde', 'noche']),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1).max(100).refine(value => {
    try { new Intl.DateTimeFormat('es', { timeZone: value }); return true; } catch { return false; }
  }, 'Zona horaria desconocida.')
}).strict();
export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre o alias.').max(30),
  age: z.union([z.literal(6), z.literal(7)]),
  interests: z.array(z.enum(['aventuras', 'fantasía', 'animales', 'naturaleza'])).min(1).max(4)
    .refine(items => new Set(items).size === items.length),
  plan: planSchema, preferences: preferencesSchema
}).strict();
const duration = z.number().finite().min(0).max(86400);
export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('createProfile'), input: profileSchema }).strict(),
  z.object({ type: z.literal('updateProfile'), input: profileSchema }).strict(),
  z.object({ type: z.literal('switchProfile'), childId: identifier }).strict(),
  z.object({ type: z.literal('startReading'), storyId: identifier, reread: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('saveReading'), sessionId: identifier, sceneIndex: z.number().int().min(0).max(999), activeDurationSeconds: duration, pause: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('finishReading'), sessionId: identifier, activeDurationSeconds: duration }).strict(),
  z.object({ type: z.literal('deferActivity'), sessionId: identifier }).strict(),
  z.object({ type: z.literal('completeActivity'), sessionId: identifier, order: z.array(identifier).max(10).optional() }).strict(),
  z.object({ type: z.literal('toggleFavorite'), storyId: identifier }).strict(),
  z.object({ type: z.literal('selectAvatar'), characterId: identifier }).strict(),
  z.object({ type: z.literal('rateStory'), storyId: identifier, rating: z.enum(['LOVE', 'LIKE', 'NOT_FAVORITE']) }).strict(),
  z.object({ type: z.literal('updatePreferences'), preferences: preferencesSchema }).strict(),
  z.object({ type: z.literal('readReminder'), reminderId: identifier }).strict()
]);
