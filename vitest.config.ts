import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    clearMocks: true,
    coverage: { include: ['src/modules/**/domain.ts', 'src/modules/reader/active-clock.ts', 'src/modules/reminders/schedule.ts'] }
  }
});
