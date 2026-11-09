import { describe, expect, it } from 'vitest';
import { isCorrectSequence, seededShuffle } from '../../src/modules/activities/domain';

describe('orden narrativo', () => {
  const expected = ['nilo-1', 'nilo-2', 'nilo-4', 'nilo-6'];
  it('produce una mezcla reproducible sin perder ni duplicar ilustraciones', () => {
    const first = seededShuffle(expected, 'sesion-estable');
    expect(first).toEqual(seededShuffle(expected, 'sesion-estable'));
    expect([...first].sort()).toEqual([...expected].sort());
    expect(first).not.toEqual(expected);
    expect(expected).toEqual(['nilo-1', 'nilo-2', 'nilo-4', 'nilo-6']);
  });
  it('valida orden, cantidad y unicidad antes de completar', () => {
    expect(isCorrectSequence(expected, expected)).toBe(true);
    expect(isCorrectSequence([...expected].reverse(), expected)).toBe(false);
    expect(isCorrectSequence(expected.slice(0, -1), expected)).toBe(false);
    expect(isCorrectSequence(['nilo-1', 'nilo-1', 'nilo-4', 'nilo-6'], expected)).toBe(false);
    expect(isCorrectSequence([...expected, 'nilo-7'], expected)).toBe(false);
  });
});
