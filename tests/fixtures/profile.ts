import type { ProfileInput } from '../../src/core/contracts';

export const profileInput: ProfileInput = {
  name: 'Explorador de prueba', age: 6, interests: ['aventuras', 'animales'],
  plan: { minutes: 10, days: [0, 1, 2, 3, 4, 5, 6], moment: 'tarde', time: '17:30', timezone: 'America/Guayaquil' },
  preferences: { pendingActivities: true, readingSessions: true, motivation: true, muted: true, reducedMotion: false, largeText: false }
};
