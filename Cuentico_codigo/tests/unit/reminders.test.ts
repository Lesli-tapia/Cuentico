import { describe, expect, it } from 'vitest';
import type { ReadingPlan } from '../../src/core/contracts';
import { nextReminderAt } from '../../src/modules/reminders/schedule';

const plan: ReadingPlan = { minutes: 10, days: [0, 1, 2, 3, 4, 5, 6], moment: 'tarde', time: '17:30', timezone: 'America/Guayaquil' };

describe('recordatorios según rutina y zona horaria', () => {
  it('elige hoy si la hora todavía no pasó en Guayaquil', () => {
    expect(nextReminderAt(plan, new Date('2026-11-08T22:00:00Z')).toISOString()).toBe('2026-11-08T22:30:00.000Z');
  });
  it('elige el próximo día seleccionado sin reutilizar una hora ya pasada', () => {
    expect(nextReminderAt({ ...plan, days: [1] }, new Date('2026-11-08T23:00:00Z')).toISOString()).toBe('2026-11-09T22:30:00.000Z');
    expect(nextReminderAt(plan, new Date('2026-11-08T22:30:01Z')).toISOString()).toBe('2026-11-09T22:30:00.000Z');
  });
  it('calcula otra zona sin depender de la zona del servidor', () => {
    const newYork = { ...plan, days: [0], time: '03:30', timezone: 'America/New_York' };
    expect(nextReminderAt(newYork, new Date('2026-03-08T06:00:00Z')).toISOString()).toBe('2026-03-08T07:30:00.000Z');
  });
  it('elige la segunda ocurrencia de una hora repetida si la primera ya pasó', () => {
    const repeatedHour = { ...plan, days: [0], time: '01:30', timezone: 'America/New_York' };
    expect(nextReminderAt(repeatedHour, new Date('2026-11-01T05:45:00Z')).toISOString()).toBe('2026-11-01T06:30:00.000Z');
  });
  it('lleva una hora inexistente al primer minuto real después del salto', () => {
    const skippedHour = { ...plan, days: [0], time: '02:30', timezone: 'America/New_York' };
    expect(nextReminderAt(skippedHour, new Date('2026-03-08T06:00:00Z')).toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });
});
