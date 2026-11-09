import catalogData from '../../../content/catalog.json';
import tipsData from '../../../content/tips.json';

export type EventType = 'SOUND_EFFECT' | 'AMBIENT_AUDIO' | 'IMAGE_ANIMATION' | 'PARTICLE_EFFECT';
export type EventTrigger = 'ON_SCENE_ENTER' | 'AFTER_DELAY' | 'ON_USER_INTERACTION';
export type ActivityType = 'FAVORITE_MOMENT' | 'SEQUENCE' | 'GUESS_CHARACTER';
export type AccessState = 'Free' | 'PremiumLocked' | 'Purchased';

export interface SceneEvent {
  sceneId: string;
  eventType: EventType;
  trigger: EventTrigger;
  delayMs: number;
  asset: string | null;
  durationMs: number;
  enabled: boolean;
}

export interface StoryScene {
  id: string;
  index: number;
  image: string;
  paragraphs: string[];
  events: SceneEvent[];
}

export interface StoryCharacter {
  id: string;
  name: string;
  image: string;
}

export interface StoryActivity {
  id: string;
  type: ActivityType;
  title: string;
  sceneIds: string[];
}

export interface Story {
  id: string;
  title: string;
  description: string;
  order: number;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  theme: string;
  cover: string;
  available: boolean;
  scenes: StoryScene[];
  character: StoryCharacter | null;
  activity: StoryActivity | null;
}

export interface ContentCatalog {
  universe: { id: string; title: string };
  library: { id: string; title: string; access: AccessState };
  stories: Story[];
}

export const catalog: ContentCatalog = catalogData as ContentCatalog;
export const stories = catalog.stories.filter((story) => story.available);
export const tips: { before: string[]; during: string[] } = tipsData;

export function findStory(id: string): Story | undefined {
  return stories.find((story) => story.id === id);
}
