import { test, expect } from '@playwright/test';
import catalog from '../../content/catalog.json';
import { command, createProfile, finishStory, profileInput } from './helpers';

test('crea un perfil válido y conserva la rutina después de una nueva consulta', async ({ request }) => {
  const invalid = await request.post('/api/app', { data: { type: 'createProfile', input: { ...profileInput, age: 5 } } });
  expect(invalid.status()).toBe(400);
  const created = await createProfile(request);
  expect(created.state.child?.name).toBe(profileInput.name);
  const state = (await (await request.get('/api/app')).json()).state;
  expect(state.child.id).toBe(created.state.child?.id);
  expect(state.plan.timezone).toBe('America/Guayaquil');
  expect(state.plan.days).toEqual(profileInput.plan.days);
});

test('guarda, pausa y reanuda la misma sesión sin sumar tiempo duplicado', async ({ request }) => {
  await createProfile(request);
  const started = await command(request, { type: 'startReading', storyId: 'alas' });
  const sessionId = started.result!.sessionId!;
  const save = { type: 'saveReading' as const, sessionId, sceneIndex: 2, activeDurationSeconds: 1, pause: true };
  const paused = await command(request, save);
  expect(paused.state.sessions.find(s => s.id === sessionId)?.status).toBe('Paused');
  await command(request, save);
  const resumed = await command(request, { type: 'startReading', storyId: 'alas' });
  expect(resumed.result?.sessionId).toBe(sessionId);
  const session = resumed.state.sessions.find(s => s.id === sessionId)!;
  expect(session.lastSceneIndex).toBe(2);
  expect(session.activeDurationSeconds).toBe(1);
  expect(resumed.state.sessions).toHaveLength(1);
  expect(resumed.state.attempts).toHaveLength(1);
});

test('la lectura completa desbloquea una vez y mantiene la actividad pendiente', async ({ request }) => {
  await createProfile(request);
  const { sessionId, finished } = await finishStory(request, 'alas');
  expect(finished.state.progress.find(p => p.storyId === 'alas')?.status).toBe('Completed');
  expect(finished.state.sessions.find(s => s.id === sessionId)?.finishedAt).toBeTruthy();
  expect(finished.state.attempts.find(a => a.sessionId === sessionId)?.status).toBe('Pending');
  expect(finished.state.unlocks).toHaveLength(1);
  const secondFinish = await command(request, { type: 'finishReading', sessionId, activeDurationSeconds: 0 });
  expect(secondFinish.state.unlocks).toHaveLength(1);
  expect(secondFinish.state.attempts).toHaveLength(1);
  const deferred = await command(request, { type: 'deferActivity', sessionId });
  await command(request, { type: 'deferActivity', sessionId });
  expect(deferred.state.attempts[0].status).toBe('Pending');
  const completed = await command(request, { type: 'completeActivity', sessionId });
  expect(completed.state.attempts[0].status).toBe('Completed');
  const again = await command(request, { type: 'completeActivity', sessionId });
  expect(again.state.attempts).toHaveLength(1);
  expect(again.state.reminders.filter(r => r.type === 'PendingActivity')).toHaveLength(0);
});

test('comprueba secuencias en servidor y permite reintentar una respuesta incorrecta', async ({ request }) => {
  await createProfile(request);
  const { sessionId } = await finishStory(request, 'nilo');
  const expected = catalog.stories.find(s => s.id === 'nilo')!.activity!.sceneIds;
  const incorrect = await command(request, { type: 'completeActivity', sessionId, order: [...expected].reverse() });
  expect(incorrect.result?.correct).toBe(false);
  expect(incorrect.state.attempts.find(a => a.sessionId === sessionId)?.status).toBe('Pending');
  const correct = await command(request, { type: 'completeActivity', sessionId, order: expected });
  expect(correct.result?.correct).toBe(true);
  expect(correct.state.attempts.find(a => a.sessionId === sessionId)?.status).toBe('Completed');
});

test('favoritos únicos, avatar desbloqueado y valoración por perfil', async ({ request }) => {
  await createProfile(request);
  const story = catalog.stories.find(s => s.id === 'alas')!;
  const locked = await request.post('/api/app', { data: { type: 'selectAvatar', characterId: story.character!.id } });
  expect(locked.ok()).toBe(false);
  const favorite = await command(request, { type: 'toggleFavorite', storyId: 'alas' });
  expect(favorite.state.favorites).toEqual(['alas']);
  const unfavorite = await command(request, { type: 'toggleFavorite', storyId: 'alas' });
  expect(unfavorite.state.favorites).toEqual([]);
  await finishStory(request, 'alas');
  const avatar = await command(request, { type: 'selectAvatar', characterId: story.character!.id });
  expect(avatar.state.child?.avatarCharacterId).toBe(story.character!.id);
  const rated = await command(request, { type: 'rateStory', storyId: 'alas', rating: 'LOVE' });
  expect(rated.state.progress.find(p => p.storyId === 'alas')?.rating).toBe('LOVE');
  const updated = await command(request, { type: 'updatePreferences', preferences: { ...profileInput.preferences, pendingActivities: false, readingSessions: false, motivation: false, largeText: true } });
  expect(updated.state.preferences.largeText).toBe(true);
  expect(updated.state.preferences.pendingActivities).toBe(false);
});

test('aísla perfiles y rechaza un quinto cuento sin contenido', async ({ request }) => {
  const first = await createProfile(request);
  await command(request, { type: 'toggleFavorite', storyId: 'alas' });
  const second = await command(request, { type: 'createProfile', input: { ...profileInput, name: 'Segundo perfil', age: 7 } });
  expect(second.state.profiles).toHaveLength(2);
  expect(second.state.favorites).toHaveLength(0);
  const switched = await command(request, { type: 'switchProfile', childId: first.state.child!.id });
  expect(switched.state.favorites).toEqual(['alas']);
  const unavailable = await request.post('/api/app', { data: { type: 'startReading', storyId: 'proximamente' } });
  expect(unavailable.ok()).toBe(false);
  const crossOrigin = await request.post('/api/app', { data: { type: 'toggleFavorite', storyId: 'alas' }, headers: { Origin: 'https://example.invalid' } });
  expect(crossOrigin.status()).toBe(403);
});

test('rechaza finalizar antes de la última escena y acceder a sesiones de otra familia', async ({ request, playwright, baseURL }) => {
  const family = await createProfile(request);
  const started = await command(request, { type: 'startReading', storyId: 'alas' });
  const sessionId = started.result!.sessionId!;
  const premature = await request.post('/api/app', { data: { type: 'finishReading', sessionId, activeDurationSeconds: 0 } });
  expect(premature.ok()).toBe(false);
  const outsider = await playwright.request.newContext({ baseURL });
  try {
    await createProfile(outsider);
    const foreignSession = await outsider.post('/api/app', { data: { type: 'saveReading', sessionId, sceneIndex: 1, activeDurationSeconds: 0 } });
    expect(foreignSession.ok()).toBe(false);
    const foreignProfile = await outsider.post('/api/app', { data: { type: 'switchProfile', childId: family.state.child!.id } });
    expect(foreignProfile.ok()).toBe(false);
  } finally { await outsider.dispose(); }
});

test('cambiar el sonido conserva la fecha y la deduplicación de una actividad pospuesta', async ({ request }) => {
  await createProfile(request);
  const { sessionId } = await finishStory(request, 'alas');
  const deferred = await command(request, { type: 'deferActivity', sessionId });
  const reminder = deferred.state.reminders.find(r => r.type === 'PendingActivity');
  expect(reminder).toBeTruthy();
  const updated = await command(request, { type: 'updatePreferences', preferences: { ...deferred.state.preferences, muted: !deferred.state.preferences.muted } });
  const afterChange = updated.state.reminders.filter(r => r.type === 'PendingActivity');
  expect(afterChange).toHaveLength(1);
  expect(afterChange[0].id).toBe(reminder!.id);
  expect(afterChange[0].dueAt).toBe(reminder!.dueAt);
  const twice = await command(request, { type: 'deferActivity', sessionId });
  expect(twice.state.reminders.filter(r => r.type === 'PendingActivity')).toHaveLength(1);
});

test('un formulario de otro perfil abierto antes del cambio no sobrescribe al lector activo', async ({ request }) => {
  const first = await createProfile(request);
  const second = await command(request, { type: 'createProfile', input: { ...profileInput, name: 'Segundo lector', age: 7 } });
  const stale = await request.post('/api/app', {
    data: { type: 'updateProfile', input: { ...profileInput, name: 'Edición de pestaña antigua' } },
    headers: { 'X-Cuentico-Child': first.state.child!.id }
  });
  expect(stale.status()).toBe(409);
  const state = (await (await request.get('/api/app')).json()).state;
  expect(state.child.id).toBe(second.state.child!.id);
  expect(state.child.name).toBe('Segundo lector');
});
