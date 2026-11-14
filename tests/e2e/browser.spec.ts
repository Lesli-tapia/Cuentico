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

test('guarda la pagina al salir con confirmacion y permite retomarla',async({page})=>{await createProfile(page.request);await page.goto('/cuentos/alas/preparacion');await expect(page).toHaveURL(/lectura\?sesion=/,{timeout:35000});await page.getByRole('button',{name:'Siguiente',exact:true}).click();await expect(page.getByLabel('Página 2',{exact:true})).toHaveAttribute('aria-current','step');await page.getByRole('button',{name:'Tamaño de texto'}).click();await page.getByRole('button',{name:'Grande',exact:true}).click();await page.getByRole('button',{name:'Volver a la librería',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Volver a la librería',exact:true}).last().click();await expect(page).toHaveURL(/libreria$/);await page.goto('/cuentos/alas/preparacion');await expect(page).toHaveURL(/lectura\?sesion=/,{timeout:35000});await expect(page.getByLabel('Página 2',{exact:true})).toHaveAttribute('aria-current','step');expect((await state(page)).sessions).toHaveLength(1);});

test('pospone una actividad, la retoma desde Inicio y ordena las ilustraciones con flechas', async ({ page }) => {
  test.setTimeout(120_000);
  await createProfile(page.request);
  const story = stories.find(item => item.id === 'nilo')!;
  const { sessionId } = await finishStory(page.request, story.id);
  await page.goto(`/cuentos/${story.id}/fin?sesion=${sessionId}`);
  await page.getByRole('button', { name: 'En otro momento', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/explorar');
  await expect(page.getByRole('heading', { name: 'Actividades pendientes', exact: true })).toBeVisible();
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
  await page.getByRole('button', { name: 'Ya terminamos la actividad', exact: true }).click();
  await expect(page).toHaveURL(/recompensa/);
  await capture(page, 'e2e-sequence-completed-mobile');
  const completed = await state(page);
  expect(completed.attempts.find(attempt => attempt.sessionId === sessionId)?.status).toBe('Completed');
  expect(completed.reminders.filter(reminder => reminder.type === 'PendingActivity')).toHaveLength(0);
});
