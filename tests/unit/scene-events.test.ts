// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {SceneEventPlayer} from '../../src/modules/reader/scene-events';
import type {SceneEvent} from '../../src/modules/content/types';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
const sound:SceneEvent={sceneId:'kiro-4',eventType:'SOUND_EFFECT',trigger:'AFTER_DELAY',delayMs:2000,durationMs:1500,asset:'/assets/audio/roar.wav',enabled:true};
it('cancela sonidos pendientes al abandonar una pagina o silenciar',async()=>{vi.useFakeTimers();const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const player=new SceneEventPlayer(false);player.trigger([sound],'ON_SCENE_ENTER',false,()=>{});player.clear();await vi.advanceTimersByTimeAsync(3000);expect(fetcher).not.toHaveBeenCalled();player.trigger([sound],'ON_SCENE_ENTER',false,()=>{});player.setMuted(true);await vi.advanceTimersByTimeAsync(3000);expect(fetcher).not.toHaveBeenCalled();player.dispose();});
it('conserva el retraso configurado para eventos visuales',async()=>{vi.useFakeTimers();const animate=vi.fn(),player=new SceneEventPlayer(false);player.trigger([{...sound,eventType:'IMAGE_ANIMATION',asset:null}],'ON_SCENE_ENTER',false,animate);await vi.advanceTimersByTimeAsync(1999);expect(animate).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(1);expect(animate).toHaveBeenCalledOnce();player.dispose();});
