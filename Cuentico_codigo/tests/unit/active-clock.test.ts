import { describe, expect, it } from 'vitest';
import { ActiveClock } from '../../src/modules/reader/active-clock';

describe('tiempo activo monotónico', () => {
  it('continúa desde el valor persistido sin sumar otra vez al consultarlo', () => {
    let now = 0;
    const clock = new ActiveClock(12, () => now);
    now = 5_000;
    expect(clock.seconds()).toBe(17);
    expect(clock.seconds()).toBe(17);
    now = 8_500;
    expect(clock.seconds()).toBe(20);
  });

  it('excluye la pestaña oculta y la pausa manual', () => {
    let now = 0;
    const clock = new ActiveClock(0, () => now);
    now = 5_000;
    clock.setVisible(false);
    now = 105_000;
    expect(clock.seconds()).toBe(5);
    clock.setVisible(true);
    now = 110_000;
    clock.setPaused(true);
    expect(clock.seconds()).toBe(10);
    now = 120_000;
    clock.setPaused(false);
    now = 125_000;
    expect(clock.seconds()).toBe(15);
  });

  it('descarta saltos grandes de suspensión y reanuda con interacción', () => {
    let now = 0;
    const clock = new ActiveClock(0, () => now);
    now = 10_000;
    expect(clock.seconds()).toBe(10);
    now = 200_000;
    expect(clock.seconds()).toBe(10);
    clock.activity();
    now = 205_000;
    expect(clock.seconds()).toBe(15);
  });

  it('deja de contar después de inactividad prolongada', () => {
    let now = 0;
    const clock = new ActiveClock(0, () => now, 20_000, 15_000);
    now = 10_000;
    expect(clock.seconds()).toBe(10);
    now = 20_000;
    expect(clock.seconds()).toBe(20);
    now = 30_000;
    expect(clock.seconds()).toBe(20);
    clock.activity();
    now = 35_000;
    expect(clock.seconds()).toBe(25);
  });
});
