import { readFileSync } from 'node:fs';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { catalog } from '../../src/modules/content/types';

// Execute the checked-in DDL in PostgreSQL WASM. These checks do not connect to
// Netlify, exercise Prisma's network driver, or use the local development DB.
const migration = readFileSync(new URL('../../prisma/postgresql/migrations/20261108000000_init/migration.sql', import.meta.url), 'utf8');
const story = catalog.stories.find(item => item.available)!;
const childInsert = 'INSERT INTO "ChildProfile" ("id", "familyId", "name", "age", "interests") VALUES ($1, $2, $3, $4, $5)';

describe('migración PostgreSQL ejecutada en memoria', () => {
  let database: PGlite;

  beforeAll(async () => {
    database = new PGlite();
    await database.exec(migration);
  }, 30_000);
  afterAll(async () => { if (database) await database.close(); });
  beforeEach(async () => { await database.exec('BEGIN'); });
  afterEach(async () => { await database.exec('ROLLBACK'); });

  async function seedRelations() {
    await database.query('INSERT INTO "Universe" ("id", "title") VALUES ($1, $2)', [catalog.universe.id, catalog.universe.title]);
    await database.query('INSERT INTO "Library" ("id", "universeId", "title") VALUES ($1, $2, $3)', [catalog.library.id, catalog.universe.id, catalog.library.title]);
    await database.query(
      'INSERT INTO "Story" ("id", "libraryId", "title", "description", "order", "durationMinutes", "theme", "cover") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [story.id, catalog.library.id, story.title, story.description, story.order, story.durationMinutes, story.theme, story.cover]
    );
    await database.query('INSERT INTO "FamilyProfile" ("id", "tokenHash") VALUES ($1, $2)', ['family-fixture', 'token-hash-fixture']);
    await database.query(childInsert, ['child-fixture', 'family-fixture', 'Perfil de prueba', 6, JSON.stringify(['aventuras'])]);
    await database.query(
      'INSERT INTO "Activity" ("id", "storyId", "type", "title", "sceneIds") VALUES ($1, $2, $3, $4, $5)',
      [story.activity!.id, story.id, story.activity!.type, story.activity!.title, JSON.stringify(story.activity!.sceneIds)]
    );
    await database.query('INSERT INTO "Character" ("id", "name", "storyId", "image") VALUES ($1, $2, $3, $4)', [story.character!.id, story.character!.name, story.id, story.character!.image]);
    await database.query('INSERT INTO "ReadingSession" ("id", "storyId", "childProfileId") VALUES ($1, $2, $3)', ['session-fixture', story.id, 'child-fixture']);
  }

  it('aplica el SQL y crea las 19 tablas del dominio', async () => {
    const result = await database.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    expect(result.rows.map(row => row.table_name)).toEqual([
      'Activity', 'ActivityAttempt', 'Character', 'CharacterUnlock', 'ChildProfile',
      'FamilyProfile', 'Favorite', 'Library', 'LibraryEntitlement', 'NotificationPreference',
      'ParentTip', 'ReadingPlan', 'ReadingSession', 'Reminder', 'Story', 'StoryMedia',
      'StoryProgress', 'StoryScene', 'Universe'
    ]);
  });

  it('rechaza perfiles infantiles que no pertenecen a una familia existente', async () => {
    await expect(database.query(childInsert, ['orphan-fixture', 'missing-family', 'Perfil de prueba', 6, '[]']))
      .rejects.toMatchObject({ code: '23503' });
  });

  it('impide duplicar un favorito para el mismo perfil y cuento', async () => {
    await seedRelations();
    const sql = 'INSERT INTO "Favorite" ("id", "childProfileId", "storyId") VALUES ($1, $2, $3)';
    await database.query(sql, ['favorite-one', 'child-fixture', story.id]);
    await expect(database.query(sql, ['favorite-two', 'child-fixture', story.id]))
      .rejects.toMatchObject({ code: '23505' });
  });

  it('impide desbloquear dos veces el mismo personaje para un perfil', async () => {
    await seedRelations();
    const sql = 'INSERT INTO "CharacterUnlock" ("id", "childProfileId", "characterId") VALUES ($1, $2, $3)';
    await database.query(sql, ['unlock-one', 'child-fixture', story.character!.id]);
    await expect(database.query(sql, ['unlock-two', 'child-fixture', story.character!.id]))
      .rejects.toMatchObject({ code: '23505' });
  });

  it('impide duplicar la actividad asignada a una sesión', async () => {
    await seedRelations();
    const sql = 'INSERT INTO "ActivityAttempt" ("id", "sessionId", "activityId") VALUES ($1, $2, $3)';
    await database.query(sql, ['attempt-one', 'session-fixture', story.activity!.id]);
    await expect(database.query(sql, ['attempt-two', 'session-fixture', story.activity!.id]))
      .rejects.toMatchObject({ code: '23505' });
  });

  it('revierte un perfil parcial si falla el guardado de su plan en la misma transacción', async () => {
    await seedRelations();
    await database.exec('SAVEPOINT profile_write');
    await database.query(childInsert, ['partial-child', 'family-fixture', 'Perfil de prueba', 7, '[]']);
    await expect(database.query(
      'INSERT INTO "ReadingPlan" ("id", "childProfileId", "minutes", "days", "moment", "time", "timezone") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ['partial-plan', 'missing-child', 10, '[1,3,5]', 'tarde', '17:30', 'America/Guayaquil']
    )).rejects.toMatchObject({ code: '23503' });
    await database.exec('ROLLBACK TO SAVEPOINT profile_write');

    const child = await database.query('SELECT "id" FROM "ChildProfile" WHERE "id" = $1', ['partial-child']);
    const plan = await database.query('SELECT "id" FROM "ReadingPlan" WHERE "id" = $1', ['partial-plan']);
    const original = await database.query('SELECT "id" FROM "ChildProfile" WHERE "id" = $1', ['child-fixture']);
    expect(child.rows).toHaveLength(0);
    expect(plan.rows).toHaveLength(0);
    expect(original.rows).toHaveLength(1);
  });
});
