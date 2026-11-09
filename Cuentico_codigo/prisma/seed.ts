import { PrismaClient } from '@prisma/client';
import { catalog, tips } from '../src/modules/content/types';

export async function seedContent(client: PrismaClient): Promise<void> {
  await client.$transaction(async tx => {
    await tx.universe.upsert({ where: { id: catalog.universe.id }, create: catalog.universe, update: catalog.universe });
    const library = { ...catalog.library, universeId: catalog.universe.id };
    await tx.library.upsert({ where: { id: library.id }, create: library, update: library });
    for (const source of catalog.stories) {
      const { scenes, character, activity, ...metadata } = source;
      const story = { ...metadata, libraryId: library.id };
      await tx.story.upsert({ where: { id: story.id }, create: story, update: story });
      for (const scene of scenes) {
        const data = {
          id: scene.id, storyId: story.id, index: scene.index, image: scene.image,
          paragraphs: JSON.stringify(scene.paragraphs), events: JSON.stringify(scene.events)
        };
        await tx.storyScene.upsert({ where: { id: scene.id }, create: data, update: data });
        const media = { id: `${scene.id}-illustration`, storyId: story.id, sceneId: scene.id, kind: 'IMAGE', asset: scene.image };
        await tx.storyMedia.upsert({ where: { id: media.id }, create: media, update: media });
      }
      if (character) {
        const data = { ...character, storyId: story.id };
        await tx.character.upsert({ where: { id: character.id }, create: data, update: data });
      }
      if (activity) {
        const data = { ...activity, storyId: story.id, sceneIds: JSON.stringify(activity.sceneIds) };
        await tx.activity.upsert({ where: { id: activity.id }, create: data, update: data });
      }
    }
    for (const stage of ['before', 'during'] as const) {
      for (const [order, text] of tips[stage].entries()) {
        const data = { id: `${stage}-${order + 1}`, stage, order, text };
        await tx.parentTip.upsert({ where: { id: data.id }, create: data, update: data });
      }
    }
  }, { timeout: 30000 });
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed.ts')) {
  const client = new PrismaClient();
  seedContent(client)
    .then(() => console.log('Contenido importado: 4 cuentos, 24 escenas, 31 consejos. Quinto cuento pendiente.'))
    .catch(error => { console.error(error); process.exitCode = 1; })
    .finally(() => client.$disconnect());
}
