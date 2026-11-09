import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalog, tips } from '../../src/modules/content/types';

describe('integridad del catálogo importado', () => {
  it('publica cuatro cuentos reales y reserva un quinto sin narrativa', () => {
    const available = catalog.stories.filter(story => story.available);
    expect(available.map(story => story.id)).toEqual(['alas', 'nilo', 'kiro', 'tortas']);
    expect(catalog.stories).toHaveLength(5);
    const pending = catalog.stories.find(story => !story.available)!;
    expect(pending.scenes).toHaveLength(0);
    expect(pending.activity).toBeNull();
    expect(pending.character).toBeNull();
  });
  it('resuelve todas las ilustraciones y conserva seis escenas por cuento', () => {
    const sceneIds = new Set<string>();
    for (const story of catalog.stories.filter(s => s.available)) {
      expect(story.scenes).toHaveLength(6);
      expect(existsSync(resolve('public', story.cover.replace(/^\//, '')))).toBe(true);
      for (const [index, scene] of story.scenes.entries()) {
        expect(scene.index).toBe(index);
        expect(scene.paragraphs.length).toBeGreaterThan(0);
        expect(sceneIds.has(scene.id)).toBe(false);
        sceneIds.add(scene.id);
        expect(existsSync(resolve('public', scene.image.replace(/^\//, '')))).toBe(true);
        for (const event of scene.events) {
          if (event.asset) expect(existsSync(resolve('public', event.asset.replace(/^\//, '')))).toBe(true);
        }
      }
      expect(story.activity).toBeTruthy();
      for (const id of story.activity!.sceneIds) expect(story.scenes.some(scene => scene.id === id)).toBe(true);
    }
  });
  it('incluye consejos originales antes y durante la lectura', () => {
    expect(tips.before).toHaveLength(18);
    expect(tips.during).toHaveLength(13);
    expect(tips.before.every(tip => tip.length > 0)).toBe(true);
    expect(tips.during.every(tip => tip.length > 0)).toBe(true);
  });
});
