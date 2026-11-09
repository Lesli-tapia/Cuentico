import { expect, type APIRequestContext } from '@playwright/test';
import type { AppResponse, Command } from '../../src/core/contracts';
import { profileInput } from '../fixtures/profile';
export { profileInput };

export async function command(request: APIRequestContext, value: Command): Promise<AppResponse> {
  const response = await request.post('/api/app', { data: value });
  const body: unknown = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  return body as AppResponse;
}

export async function createProfile(request: APIRequestContext) {
  return command(request, { type: 'createProfile', input: profileInput });
}

export async function finishStory(request: APIRequestContext, storyId: string) {
  const started = await command(request, { type: 'startReading', storyId });
  const sessionId = started.result?.sessionId;
  expect(sessionId).toBeTruthy();
  for (let sceneIndex = 0; sceneIndex < 6; sceneIndex++) {
    await command(request, { type: 'saveReading', sessionId: sessionId!, sceneIndex, activeDurationSeconds: 0 });
  }
  const finished = await command(request, { type: 'finishReading', sessionId: sessionId!, activeDurationSeconds: 0 });
  return { sessionId: sessionId!, finished };
}
