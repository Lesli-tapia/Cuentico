import { createHash, randomBytes } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { AppState, Command, Preferences, ReadingPlan, Session, Progress } from '@/core/contracts';
import { catalog } from '@/modules/content/types';
import { isCorrectSequence } from '@/modules/activities/domain';
import { defaultPlan, nextReminderAt } from '@/modules/reminders/schedule';
import { commandSchema } from './validation';
import { getDatabaseClient } from './db';

type Transaction = Prisma.TransactionClient;
export class ApplicationError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = 'ApplicationError'; }
}
export const defaultPreferences: Preferences = {
  pendingActivities: true, readingSessions: true, motivation: false, muted: true, reducedMotion: false, largeText: false
};
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function emptyState(): AppState {
  return { family: null, profiles: [], child: null, plan: defaultPlan, preferences: defaultPreferences,
    progress: [], sessions: [], attempts: [], unlocks: [], favorites: [], reminders: [] };
}

function preferencesOf(value: Preferences | null): Preferences {
  if (!value) return { ...defaultPreferences };
  return {
    pendingActivities: value.pendingActivities, readingSessions: value.readingSessions, motivation: value.motivation,
    muted: value.muted, reducedMotion: value.reducedMotion, largeText: value.largeText
  };
}
function planOf(value: { minutes: number; days: string; moment: string; time: string; timezone: string } | null): ReadingPlan {
  return value ? { minutes: value.minutes, days: JSON.parse(value.days) as number[], moment: value.moment, time: value.time, timezone: value.timezone } : { ...defaultPlan };
}

async function scheduleRoutine(tx: Transaction, familyId: string, childId: string, plan: ReadingPlan, preferences: Preferences, now: Date) {
  const dueAt = nextReminderAt(plan, now);
  const dateKey = dueAt.toISOString();
  const messages = [
    { enabled: preferences.readingSessions, type: 'ReadingSession', message: 'Una nueva aventura los espera. ¿Compartimos un cuento?' },
    { enabled: preferences.motivation, type: 'Motivation', message: 'Cada historia compartida es un nuevo recuerdo juntos.' }
  ];
  for (const item of messages) {
    if (!item.enabled) continue;
    const dedupeKey = `${childId}:${item.type}:${dateKey}`;
    await tx.reminder.upsert({ where: { dedupeKey }, update: {}, create: {
      familyId, childProfileId: childId, dedupeKey, type: item.type, message: item.message, dueAt
    } });
  }
}

async function scheduleActivity(tx: Transaction, familyId: string, childId: string, sessionId: string, plan: ReadingPlan, preferences: Preferences, now: Date) {
  if (!preferences.pendingActivities) return;
  const session = await tx.readingSession.findFirst({ where: { id: sessionId, childProfileId: childId }, include: { story: true, attempt: true } });
  if (!session || session.status !== 'Completed' || session.attempt?.status !== 'Pending') return;
  const dedupeKey = `${sessionId}:PendingActivity`;
  await tx.reminder.upsert({ where: { dedupeKey }, update: {}, create: {
    familyId, childProfileId: childId, sessionId, dedupeKey, type: 'PendingActivity',
    message: `Cuando quieran, pueden jugar con «${session.story.title}».`, dueAt: nextReminderAt(plan, now)
  } });
}

export async function getAppState(hash: string | undefined, client?: PrismaClient, now = new Date()): Promise<AppState> {
  if (!hash) return emptyState();
  client ??= getDatabaseClient();
  const family = await client.familyProfile.findUnique({ where: { tokenHash: hash }, include: { children: { orderBy: { createdAt: 'asc' } }, preferences: true } });
  if (!family) return emptyState();
  const child = family.children.find(item => item.id === family.activeChildId) ?? family.children[0];
  if (!child) return emptyState();
  const profileIds = family.children.map(item => item.id);
  const [planRecord, progress, sessions, unlocks, favorites] = await Promise.all([
    client.readingPlan.findUnique({ where: { childProfileId: child.id } }),
    client.storyProgress.findMany({ where: { childProfileId: child.id } }),
    client.readingSession.findMany({ where: { childProfileId: child.id }, orderBy: { startedAt: 'desc' } }),
    client.characterUnlock.findMany({ where: { childProfileId: child.id } }),
    client.favorite.findMany({ where: { childProfileId: child.id } })
  ]);
  const preferences = preferencesOf(family.preferences);
  const plan = planOf(planRecord);
  await client.$transaction(tx => scheduleRoutine(tx, family.id, child.id, plan, preferences, now));
  const [attempts, reminders] = await Promise.all([
    client.activityAttempt.findMany({ where: { session: { childProfileId: child.id } } }),
    client.reminder.findMany({ where: { childProfileId: child.id }, orderBy: { dueAt: 'asc' }, include: { session: { include: { attempt: true } } } })
  ]);
  const profiles = family.children.map(item => ({ id: item.id, name: item.name, age: item.age,
    interests: JSON.parse(item.interests) as string[], avatarCharacterId: item.avatarCharacterId }));
  return {
    family: { id: family.id, activeChildId: profileIds.includes(child.id) ? child.id : null }, profiles,
    child: profiles.find(item => item.id === child.id)!, plan, preferences,
    progress: progress.map(item => ({ storyId: item.storyId, status: item.status as Progress['status'], lastSceneIndex: item.lastSceneIndex, rating: item.rating as Progress['rating'] })),
    sessions: sessions.map(item => ({ id: item.id, storyId: item.storyId, childProfileId: item.childProfileId, startedAt: item.startedAt.toISOString(),
      finishedAt: item.finishedAt?.toISOString() ?? null, activeDurationSeconds: item.activeDurationSeconds, status: item.status as Session['status'], lastSceneIndex: item.lastSceneIndex })),
    attempts: attempts.map(item => ({ id: item.id, sessionId: item.sessionId, activityId: item.activityId, status: item.status as 'Pending' | 'Completed', tries: item.tries, completedAt: item.completedAt?.toISOString() ?? null })),
    unlocks: unlocks.map(item => ({ characterId: item.characterId, unlockedAt: item.unlockedAt.toISOString() })),
    favorites: favorites.map(item => item.storyId),
    reminders: reminders.filter(item => {
      if (item.type === 'PendingActivity') return preferences.pendingActivities && item.session?.attempt?.status === 'Pending';
      if (item.type === 'ReadingSession') return preferences.readingSessions;
      return preferences.motivation;
    }).map(item => ({ id: item.id, type: item.type, message: item.message, dueAt: item.dueAt.toISOString(), readAt: item.readAt?.toISOString() ?? null }))
  };
}

/** Absolute cumulative duration makes retries/reloads idempotent; wall time bounds forged values. */
export function acceptedDuration(current: number, requested: number, startedAt: Date, now: Date): number {
  return Math.max(current, Math.min(requested, Math.max(0, (now.getTime() - startedAt.getTime()) / 1000) + 5));
}

export async function executeCommand(raw: unknown, hash: string | undefined, client: PrismaClient | undefined = undefined, now = new Date(), expectedChildId?: string): Promise<{
  state: AppState; result?: { sessionId?: string; correct?: boolean }; newToken?: string;
}> {
  const parsed = commandSchema.safeParse(raw);
  if (!parsed.success) throw new ApplicationError('Revisa los datos enviados. El perfil necesita una edad de 6 o 7 años y una rutina válida.');
  const command: Command = parsed.data;
  client ??= getDatabaseClient();
  let newToken: string | undefined;
  let activeHash = hash;
  let result: { sessionId?: string; correct?: boolean } | undefined;

  await client.$transaction(async tx => {
    let family = activeHash ? await tx.familyProfile.findUnique({ where: { tokenHash: activeHash }, include: { preferences: true } }) : null;
    if (command.type === 'createProfile') {
      if (!family) {
        newToken = randomBytes(32).toString('base64url'); activeHash = tokenHash(newToken);
        family = await tx.familyProfile.create({ data: { tokenHash: activeHash }, include: { preferences: true } });
      }
      const count = await tx.childProfile.count({ where: { familyId: family.id } });
      if (count >= 8) throw new ApplicationError('Esta familia ya tiene ocho perfiles.');
      const { name, age, interests, plan, preferences } = command.input;
      const child = await tx.childProfile.create({ data: { familyId: family.id, name, age, interests: JSON.stringify(interests) } });
      await tx.readingPlan.create({ data: { childProfileId: child.id, ...plan, days: JSON.stringify(plan.days) } });
      await tx.notificationPreference.upsert({ where: { familyId: family.id }, create: { familyId: family.id, ...preferences }, update: preferences });
      await tx.familyProfile.update({ where: { id: family.id }, data: { activeChildId: child.id } });
      await tx.libraryEntitlement.upsert({ where: { familyId_libraryId: { familyId: family.id, libraryId: catalog.library.id } },
        create: { familyId: family.id, libraryId: catalog.library.id, access: 'Free' }, update: {} });
      await scheduleRoutine(tx, family.id, child.id, plan, preferences, now);
      return;
    }
    if (!family?.activeChildId) throw new ApplicationError('Primero configura tu perfil familiar.', 401);
    if (command.type !== 'switchProfile' && expectedChildId && expectedChildId !== family.activeChildId) {
      throw new ApplicationError('El perfil cambió en otra pestaña. Vuelve a abrir esta pantalla para continuar.', 409);
    }
    const child = await tx.childProfile.findFirst({ where: { id: family.activeChildId, familyId: family.id }, include: { plan: true } });
    if (!child) throw new ApplicationError('No encontramos el perfil.', 404);
    const plan = planOf(child.plan);
    const preferences = preferencesOf(family.preferences);

    if (command.type === 'switchProfile') {
      const target = await tx.childProfile.findFirst({ where: { id: command.childId, familyId: family.id } });
      if (!target) throw new ApplicationError('Ese perfil no pertenece a esta familia.', 404);
      await tx.readingSession.updateMany({ where: { childProfileId: child.id, status: 'Active' }, data: { status: 'Paused' } });
      await tx.familyProfile.update({ where: { id: family.id }, data: { activeChildId: target.id } });
      return;
    }
    if (command.type === 'updateProfile' || command.type === 'updatePreferences') {
      const nextPreferences = command.type === 'updateProfile' ? command.input.preferences : command.preferences;
      const nextPlan = command.type === 'updateProfile' ? command.input.plan : plan;
      const scheduleChanged = nextPlan.time !== plan.time || nextPlan.timezone !== plan.timezone ||
        [...nextPlan.days].sort().join(',') !== [...plan.days].sort().join(',');
      const categories = [
        { key: 'pendingActivities', type: 'PendingActivity' },
        { key: 'readingSessions', type: 'ReadingSession' },
        { key: 'motivation', type: 'Motivation' }
      ] as const;
      if (command.type === 'updateProfile') {
        await tx.childProfile.update({ where: { id: child.id }, data: { name: command.input.name, age: command.input.age, interests: JSON.stringify(command.input.interests) } });
        await tx.readingPlan.upsert({ where: { childProfileId: child.id }, create: { childProfileId: child.id, ...nextPlan, days: JSON.stringify(nextPlan.days) }, update: { ...nextPlan, days: JSON.stringify(nextPlan.days) } });
      }
      await tx.notificationPreference.upsert({ where: { familyId: family.id }, create: { familyId: family.id, ...nextPreferences }, update: nextPreferences });
      if (scheduleChanged) {
        await tx.reminder.deleteMany({ where: { childProfileId: child.id, readAt: null } });
      }
      for (const category of categories) {
        if (preferences[category.key] !== nextPreferences[category.key]) {
          // Category preferences belong to the family. An unrelated sound or display
          // change must preserve pending reminders, their identities and due times.
          await tx.reminder.deleteMany({ where: { familyId: family.id, type: category.type, readAt: null } });
        }
      }
      if (scheduleChanged || preferences.readingSessions !== nextPreferences.readingSessions || preferences.motivation !== nextPreferences.motivation) {
        await scheduleRoutine(tx, family.id, child.id, nextPlan, nextPreferences, now);
      }
      if (nextPreferences.pendingActivities && (scheduleChanged || preferences.pendingActivities !== nextPreferences.pendingActivities)) {
        const pending = await tx.readingSession.findMany({ where: { childProfileId: child.id, status: 'Completed', attempt: { status: 'Pending' } } });
        for (const item of pending) await scheduleActivity(tx, family.id, child.id, item.id, nextPlan, nextPreferences, now);
      }
      return;
    }
    if (command.type === 'readReminder') {
      await tx.reminder.updateMany({ where: { id: command.reminderId, childProfileId: child.id, readAt: null }, data: { readAt: now } }); return;
    }
    if (command.type === 'toggleFavorite') {
      const story = await tx.story.findFirst({ where: { id: command.storyId, available: true } });
      if (!story) throw new ApplicationError('Este cuento todavía no está disponible.', 404);
      const unique = { childProfileId: child.id, storyId: story.id };
      const existing = await tx.favorite.findUnique({ where: { childProfileId_storyId: unique } });
      if (existing) await tx.favorite.delete({ where: { id: existing.id } });
      else await tx.favorite.create({ data: unique });
      return;
    }
    if (command.type === 'selectAvatar') {
      const unlocked = await tx.characterUnlock.findUnique({ where: { childProfileId_characterId: { childProfileId: child.id, characterId: command.characterId } } });
      if (!unlocked) throw new ApplicationError('Completa su cuento para elegir este personaje.');
      await tx.childProfile.update({ where: { id: child.id }, data: { avatarCharacterId: command.characterId } }); return;
    }
    if (command.type === 'rateStory') {
      const progress = await tx.storyProgress.findUnique({ where: { childProfileId_storyId: { childProfileId: child.id, storyId: command.storyId } } });
      if (!progress || progress.status !== 'Completed') throw new ApplicationError('Termina el cuento antes de valorarlo.');
      await tx.storyProgress.update({ where: { id: progress.id }, data: { rating: command.rating } }); return;
    }
    if (command.type === 'startReading') {
      const story = await tx.story.findFirst({ where: { id: command.storyId, available: true }, include: { activity: true } });
      if (!story?.activity) throw new ApplicationError('Este cuento todavía no está disponible.', 404);
      const entitlement = await tx.libraryEntitlement.findUnique({ where: { familyId_libraryId: { familyId: family.id, libraryId: story.libraryId } } });
      if (!entitlement || !['Free', 'Purchased'].includes(entitlement.access)) throw new ApplicationError('Esta librería no está disponible.', 403);
      const open = await tx.readingSession.findFirst({ where: { childProfileId: child.id, storyId: story.id, status: { in: ['Active', 'Paused'] } }, orderBy: { startedAt: 'desc' } });
      if (open) {
        await tx.readingSession.updateMany({ where: { childProfileId: child.id, status: 'Active', id: { not: open.id } }, data: { status: 'Paused' } });
        await tx.readingSession.update({ where: { id: open.id }, data: { status: 'Active' } }); result = { sessionId: open.id }; return;
      }
      if (!command.reread) {
        const completed = await tx.readingSession.findFirst({ where: { childProfileId: child.id, storyId: story.id, status: 'Completed' }, orderBy: { startedAt: 'desc' } });
        if (completed) { result = { sessionId: completed.id }; return; }
      }
      await tx.readingSession.updateMany({ where: { childProfileId: child.id, status: 'Active' }, data: { status: 'Paused' } });
      const session = await tx.readingSession.create({ data: { storyId: story.id, childProfileId: child.id, startedAt: now, attempt: { create: { activityId: story.activity.id } } } });
      await tx.storyProgress.upsert({ where: { childProfileId_storyId: { childProfileId: child.id, storyId: story.id } }, create: { childProfileId: child.id, storyId: story.id }, update: {} });
      result = { sessionId: session.id }; return;
    }

    const session = await tx.readingSession.findFirst({ where: { id: command.sessionId, childProfileId: child.id }, include: { story: { include: { scenes: true, character: true } }, attempt: { include: { activity: true } } } });
    if (!session) throw new ApplicationError('No encontramos esta sesión de lectura.', 404);
    if (command.type === 'saveReading') {
      if (session.status === 'Completed') return;
      if (command.sceneIndex >= session.story.scenes.length) throw new ApplicationError('Esta escena no existe.');
      await tx.readingSession.update({ where: { id: session.id }, data: {
        lastSceneIndex: command.sceneIndex, furthestSceneIndex: Math.max(session.furthestSceneIndex, command.sceneIndex),
        activeDurationSeconds: acceptedDuration(session.activeDurationSeconds, command.activeDurationSeconds, session.startedAt, now),
        status: command.pause ? 'Paused' : 'Active'
      } });
      const progress = await tx.storyProgress.findUnique({ where: { childProfileId_storyId: { childProfileId: child.id, storyId: session.storyId } } });
      if (progress?.status !== 'Completed') await tx.storyProgress.updateMany({ where: { childProfileId: child.id, storyId: session.storyId }, data: { lastSceneIndex: command.sceneIndex } });
      return;
    }
    if (command.type === 'finishReading') {
      if (session.status === 'Completed') return;
      if (session.furthestSceneIndex < session.story.scenes.length - 1) throw new ApplicationError('Todavía quedan escenas por descubrir.');
      await tx.readingSession.update({ where: { id: session.id }, data: {
        status: 'Completed', finishedAt: now, lastSceneIndex: session.story.scenes.length - 1,
        activeDurationSeconds: acceptedDuration(session.activeDurationSeconds, command.activeDurationSeconds, session.startedAt, now)
      } });
      await tx.storyProgress.update({ where: { childProfileId_storyId: { childProfileId: child.id, storyId: session.storyId } }, data: { status: 'Completed', completedAt: now, lastSceneIndex: session.story.scenes.length - 1 } });
      if (session.story.character) await tx.characterUnlock.upsert({ where: { childProfileId_characterId: { childProfileId: child.id, characterId: session.story.character.id } }, create: { childProfileId: child.id, characterId: session.story.character.id, unlockedAt: now }, update: {} });
      return;
    }
    if (session.status !== 'Completed') throw new ApplicationError('Primero terminemos la lectura.');
    if (command.type === 'deferActivity') { await scheduleActivity(tx, family.id, child.id, session.id, plan, preferences, now); return; }
    if (command.type === 'completeActivity') {
      if (!session.attempt) throw new ApplicationError('No encontramos la actividad.');
      if (session.attempt.status === 'Completed') { result = { correct: true }; return; }
      const expected = JSON.parse(session.attempt.activity.sceneIds) as string[];
      const correct = session.attempt.activity.type !== 'SEQUENCE' || isCorrectSequence(command.order ?? [], expected);
      await tx.activityAttempt.update({ where: { id: session.attempt.id }, data: {
        tries: { increment: 1 }, lastOrder: command.order ? JSON.stringify(command.order) : null,
        ...(correct ? { status: 'Completed', completedAt: now } : {})
      } });
      if (correct) await tx.reminder.deleteMany({ where: { sessionId: session.id, type: 'PendingActivity' } });
      result = { correct }; return;
    }
  }, { timeout: 15000 });

  return { state: await getAppState(activeHash, client, now), result, newToken };
}
