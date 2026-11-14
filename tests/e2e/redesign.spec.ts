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

test('recorrido familiar completo: perfil, cuento, actividad, personaje sin valoración', async ({ page }) => {
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
  await expect(page).toHaveURL(/lectura\?sesion=/, { timeout: 35000 });
  await expect(page.getByLabel('Página 1', { exact: true })).toBeVisible();
  await capture(page, 'e2e-reader-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, 'e2e-reader-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Consejos para padres', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Un consejo durante la lectura', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  for (let scene = 2; scene <= 6; scene++) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(page.getByLabel(`Página ${scene}`, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Terminar lectura', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Lectura completada!', exact: true })).toBeVisible();
  await expect(page.getByText('¿Listos para jugar y descubrir cuánto aprendimos?', { exact: true })).toBeVisible();
  const completedReading = await state(page);
  expect(completedReading.progress.find(p => p.storyId === 'alas')?.status).toBe('Completed');
  expect(completedReading.attempts[0].status).toBe('Pending');
  expect(completedReading.unlocks).toHaveLength(1);
  await capture(page, 'e2e-finished-mobile');
  await page.getByRole('link', { name: 'Comenzar actividad', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿Qué escena les gustó más y por qué?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ya terminamos la actividad', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Desbloqueaste un nuevo personaje!', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Usar como perfil', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Avatar seleccionado', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Continuar', exact: true }).click();
  await expect(page).not.toHaveURL(/valoracion/);
  await expect(page.getByRole('heading', { name: '¡Hola, Luna!', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '¡Hola, Luna!', exact: true })).toBeVisible();
  const finalState = await state(page);
  expect(finalState.attempts[0].status).toBe('Completed');
  expect(finalState.progress.find(p => p.storyId === 'alas')?.rating).toBeNull();
  expect(finalState.child?.avatarCharacterId).toBe(finalState.unlocks[0].characterId);
  expect(finalState.favorites).toEqual(['alas']);
});

