import { describe, expect, it } from 'vitest';
import { commandSchema } from '../../src/server/validation';
import { profileInput } from '../fixtures/profile';

describe('validación de entradas familiares', () => {
  it('acepta los datos mínimos del MVP y rechaza edades fuera del rango', () => {
    expect(commandSchema.safeParse({ type: 'createProfile', input: profileInput }).success).toBe(true);
    expect(commandSchema.safeParse({ type: 'createProfile', input: { ...profileInput, age: 10 } }).success).toBe(false);
    expect(commandSchema.safeParse({ type: 'createProfile', input: { ...profileInput, name: '  ' } }).success).toBe(false);
  });
  it('rechaza horas, zonas y días que no se pueden programar', () => {
    for (const plan of [
      { ...profileInput.plan, time: '25:00' },
      { ...profileInput.plan, timezone: 'Zona/Inventada' },
      { ...profileInput.plan, days: [] },
      { ...profileInput.plan, days: [1, 1] },
      { ...profileInput.plan, minutes: 7 }
    ]) {
      expect(commandSchema.safeParse({ type: 'createProfile', input: { ...profileInput, plan } }).success).toBe(false);
    }
  });
  it('rechaza duración negativa y propiedades ajenas al contrato', () => {
    expect(commandSchema.safeParse({ type: 'saveReading', sessionId: 'sesion', sceneIndex: 0, activeDurationSeconds: -1 }).success).toBe(false);
    expect(commandSchema.safeParse({ type: 'toggleFavorite', storyId: 'alas', familyId: 'otra-familia' }).success).toBe(false);
  });
});
