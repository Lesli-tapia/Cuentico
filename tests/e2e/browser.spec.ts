import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import type { AppState } from '../../src/core/contracts';
import { stories } from '../../src/modules/content/types';
import { createProfile, finishStory } from './helpers';

async function capture(page: Page, filename: string) {
  await mkdir('artifacts', { recursive: true });
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: `artifacts/${filename}.png`, fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function state(page: Page): Promise<AppState> {
  const response = await page.request.get('/api/app');
  expect(response.ok()).toBe(true);
  return (await response.json()).state;
}

test('recorrido familiar completo: perfil, cuento, actividad, personaje y valoración', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel('Nombre o alias', { exact: true }).fill('Luna');
  await page.getByLabel('Edad', { exact: true }).selectOption('6');
  await page.getByLabel('Tiempo para leer', { exact: true }).selectOption('10');
  await page.getByLabel('Momento del día', { exact: true }).selectOption('tarde');
  await page.getByLabel('Hora del recordatorio', { exact: true }).fill('17:30');
  await page.getByLabel('Zona horaria', { exact: true }).fill('America/Guayaquil');
  await page.getByRole('button', { name: '¡Comenzar nuestra aventura!', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Hola, Luna!', exact: true })).toBeVisible();
  await capture(page, 'e2e-home-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, 'e2e-home-desktop');
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Librería', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mi librería', exact: true })).toBeVisible();
  await capture(page, 'e2e-library-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, 'e2e-library-mobile');
  await page.locator('a[href="/cuentos/alas"]').first().click();
  await expect(page.getByRole('heading', { name: 'Las alas que brillaban con el sol', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar en favoritos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardado en favoritos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Comenzar lectura', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡La aventura está por empezar!', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '¡Empezar a leer!', exact: true }).click();
  await expect(page.getByText('Escena 1 de 6', { exact: true })).toBeVisible();
  await capture(page, 'e2e-reader-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, 'e2e-reader-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Consejos para padres', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Un consejo durante la lectura', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  for (let scene = 2; scene <= 6; scene++) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(page.getByText(`Escena ${scene} de 6`, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Terminar lectura', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Lectura completada!', exact: true })).toBeVisible();
  await expect(page.getByText('¿Listos para jugar y descubrir cuánto aprendimos?', { exact: true })).toBeVisible();
  const completedReading = await state(page);
  expect(completedReading.progress.find(p => p.storyId === 'alas')?.status).toBe('Completed');
  expect(completedReading.attempts[0].status).toBe('Pending');
  expect(completedReading.unlocks).toHaveLength(1);
  await capture(page, 'e2e-finished-mobile');
  await page.getByRole('link', { name: '¡Vamos a jugar!', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿Qué escena les gustó más y por qué?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ya completamos la actividad', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Un nuevo amigo en tu colección!', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Usar como avatar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Avatar seleccionado', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Me encantó', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Hola, Luna!', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '¡Hola, Luna!', exact: true })).toBeVisible();
  const finalState = await state(page);
  expect(finalState.attempts[0].status).toBe('Completed');
  expect(finalState.progress.find(p => p.storyId === 'alas')?.rating).toBe('LOVE');
  expect(finalState.child?.avatarCharacterId).toBe(finalState.unlocks[0].characterId);
  expect(finalState.favorites).toEqual(['alas']);
});

test('pausa más de un autoguardado y retoma la escena conservada tras recargar', async ({ page }) => {
  test.setTimeout(120_000);
  await createProfile(page.request);
  await page.goto('/cuentos/alas/preparacion');
  await page.getByRole('button', { name: '¡Empezar a leer!', exact: true }).click();
  await expect(page.getByText('Escena 1 de 6', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByText('Escena 2 de 6', { exact: true })).toBeVisible();
  const savePaused = page.waitForResponse(response => {
    if (response.request().method() !== 'POST' || !response.url().endsWith('/api/app')) return false;
    const payload = response.request().postDataJSON();
    return payload.type === 'saveReading' && payload.pause === true;
  });
  await page.getByRole('button', { name: 'Pausar lectura', exact: true }).click();
  expect((await savePaused).ok()).toBe(true);
  const pausedState = await state(page);
  const pausedSession = pausedState.sessions[0];
  expect(pausedSession.status).toBe('Paused');
  // The reader autosaves every ten seconds. This checks that a later autosave
  // preserves the explicit pause instead of silently switching the server to Active.
  await page.waitForTimeout(11_000);
  const afterAutosave = await state(page);
  expect(afterAutosave.sessions[0].status).toBe('Paused');
  expect(afterAutosave.sessions[0].activeDurationSeconds).toBe(pausedSession.activeDurationSeconds);
  await page.getByRole('button', { name: 'Reanudar lectura', exact: true }).first().click();
  await expect(page.getByText('Escena 2 de 6', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar y salir', exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await page.goto('/cuentos/alas');
  await page.getByRole('link', { name: 'Continuar lectura', exact: true }).click();
  await page.getByRole('button', { name: '¡Empezar a leer!', exact: true }).click();
  await expect(page.getByText('Escena 2 de 6', { exact: true })).toBeVisible();
  expect((await state(page)).sessions).toHaveLength(1);
});

test('pospone una actividad, la retoma desde Inicio y ordena las ilustraciones con flechas', async ({ page }) => {
  test.setTimeout(120_000);
  await createProfile(page.request);
  const story = stories.find(item => item.id === 'nilo')!;
  const { sessionId } = await finishStory(page.request, story.id);
  await page.goto(`/cuentos/${story.id}/fin?sesion=${sessionId}`);
  await page.getByRole('button', { name: 'Lo haremos más tarde', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Nos queda un juego', exact: true })).toBeVisible();
  await page.locator(`a[href="/cuentos/${story.id}/actividad?sesion=${sessionId}"]`).click();
  await expect(page.getByRole('heading', { name: story.activity!.title, exact: true })).toBeVisible();
  await capture(page, 'e2e-sequence-mobile');
  await page.getByRole('button', { name: 'Comprobar orden', exact: true }).click();
  await expect(page.getByText('¡Buen intento! Piensen qué pasó primero y vuelvan a probar.', { exact: true })).toBeVisible();
  expect((await state(page)).attempts.find(attempt => attempt.sessionId === sessionId)?.status).toBe('Pending');

  // The test uses the manifest as its answer key; the product never exposes it.
  // Move each illustration through the same accessible controls a family can use.
  const cards = page.locator('.sequence-card');
  for (const [targetIndex, sceneId] of story.activity!.sceneIds.entries()) {
    const desiredImage = story.scenes.find(scene => scene.id === sceneId)!.image;
    const sources = await cards.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    let currentIndex = sources.indexOf(desiredImage);
    expect(currentIndex).toBeGreaterThanOrEqual(targetIndex);
    while (currentIndex > targetIndex) {
      await page.getByRole('button', { name: `Mover tarjeta ${currentIndex + 1} antes`, exact: true }).click();
      currentIndex--;
      await expect(cards.nth(currentIndex).locator('img')).toHaveAttribute('src', desiredImage);
    }
  }
  await page.getByRole('button', { name: 'Comprobar orden', exact: true }).click();
  await expect(page.getByText('¡Lo lograron! La aventura está en orden.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver recompensa', exact: true })).toBeVisible();
  await capture(page, 'e2e-sequence-completed-mobile');
  const completed = await state(page);
  expect(completed.attempts.find(attempt => attempt.sessionId === sessionId)?.status).toBe('Completed');
  expect(completed.reminders.filter(reminder => reminder.type === 'PendingActivity')).toHaveLength(0);
});
