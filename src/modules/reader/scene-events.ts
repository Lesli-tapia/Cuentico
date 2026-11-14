import type {SceneEvent,StoryScene} from '@/modules/content/types';
import {readingTimeline,readingAudioDefaults,type ReadingAudioOptions} from './sound-schedule';
let sharedContext:AudioContext|null=null;
const encoded=new Map<string,Promise<ArrayBuffer|null>>();
function loadAsset(asset:string):Promise<ArrayBuffer|null>{
  const cached=encoded.get(asset);if(cached)return cached;
  const pending=fetch(asset).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null);
  encoded.set(asset,pending);void pending.then(result=>{if(!result)encoded.delete(asset)});return pending;
}
export async function preloadReaderAudio(events:SceneEvent[]):Promise<void>{await Promise.all([...new Set(events.filter(e=>e.enabled&&e.asset&&(e.eventType==='SOUND_EFFECT'||e.eventType==='AMBIENT_AUDIO')).map(e=>e.asset!))].map(loadAsset));}
export async function unlockReaderAudio(){if(typeof window==='undefined'||!window.AudioContext)return null;try{if(!sharedContext||sharedContext.state==='closed')sharedContext=new AudioContext();await sharedContext.resume();return sharedContext}catch{return null}}
/** Each page entry owns a generation. Stale fetches, decodes and timers cannot play. */
export class SceneEventPlayer {
  private context:AudioContext|null;private source:AudioBufferSourceNode|null=null;private gain:GainNode|null=null;
  private timers:ReturnType<typeof setTimeout>[]=[];private generation=0;private disposed=false;
  private buffers=new Map<string,Promise<AudioBuffer|null>>();private options:ReadingAudioOptions;
  constructor(private muted=true,options:Partial<ReadingAudioOptions>={}){this.context=sharedContext;this.options={...readingAudioDefaults,...options};}
  async unlock(){this.context=await unlockReaderAudio();}
  setMuted(value:boolean){this.muted=value;if(value)this.clear();}
  setVolume(value:number){this.options.effectsVolume=Math.max(0,Math.min(.35,Number.isFinite(value)?value:readingAudioDefaults.effectsVolume));if(this.gain)this.gain.gain.value=this.options.effectsVolume;}
  private stopAudio(){try{this.source?.stop()}catch{}this.source?.disconnect();this.gain?.disconnect();this.source=null;this.gain=null;}
  private buffer(asset:string){let pending=this.buffers.get(asset);if(!pending){pending=loadAsset(asset).then(async data=>{if(!data||!this.context)return null;try{return await this.context.decodeAudioData(data.slice(0))}catch{return null}});this.buffers.set(asset,pending);void pending.then(result=>{if(!result)this.buffers.delete(asset)});}return pending;}
  private async play(event:SceneEvent,generation:number){
    if(!event.asset||this.muted||this.disposed||generation!==this.generation||this.context?.state!=='running')return;
    const buffer=await this.buffer(event.asset);
    if(!buffer||this.muted||this.disposed||generation!==this.generation||this.context?.state!=='running')return;
    this.stopAudio();const source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=buffer;const level=Math.max(0,Math.min(.35,this.options.effectsVolume*(event.volume??1)));gain.gain.value=level;
    source.connect(gain);gain.connect(this.context.destination);this.source=source;this.gain=gain;
    const offset=Math.max(0,(event.clipStartMs??0)/1000),duration=Math.min(event.durationMs/1000,buffer.duration-offset);
    if(duration<=0)return;
    source.start(0,offset,duration);
    source.onended=()=>{source.disconnect();gain.disconnect();if(this.source===source){this.source=null;this.gain=null}};
  }
  enterPage(scene:StoryScene,reducedMotion:boolean,animate:(event:SceneEvent)=>void){
    this.clear();this.disposed=false;const generation=this.generation,start=performance.now();
    this.trigger(scene.events.filter(e=>e.eventType!=='SOUND_EFFECT'&&e.eventType!=='AMBIENT_AUDIO'),'ON_SCENE_ENTER',reducedMotion,animate);
    const timeline=readingTimeline(scene,this.options);
    // Fetch and decode all current-page effects before their deadlines, not at playback time.
    for(const cue of timeline.cues){if(!cue.asset)continue;
      void this.buffer(cue.asset).then(buffer=>{
        if(!buffer||generation!==this.generation||this.disposed||this.muted)return;
        const elapsed=performance.now()-start;
        if(elapsed>cue.delayMs+this.options.maximumLatenessMs)return;
        this.timers.push(setTimeout(()=>{if(generation===this.generation)void this.play(cue,generation)},Math.max(0,cue.delayMs-elapsed)));
      });
    }
    return timeline;
  }
  trigger(events:SceneEvent[],trigger:SceneEvent['trigger'],reducedMotion:boolean,animate:(event:SceneEvent)=>void){
    const generation=this.generation;
    for(const event of events.filter(e=>e.enabled&&(e.trigger===trigger||(trigger==='ON_SCENE_ENTER'&&e.trigger==='AFTER_DELAY')))){
      // Audio uses enterPage exclusively, preventing image taps from duplicating scheduled effects.
      if(event.eventType==='SOUND_EFFECT'||event.eventType==='AMBIENT_AUDIO')continue;
      this.timers.push(setTimeout(()=>{if(generation===this.generation&&!reducedMotion)animate(event)},Math.max(0,event.delayMs)));
    }
  }
  clear(){this.generation++;this.timers.forEach(clearTimeout);this.timers=[];this.stopAudio();}
  dispose(){this.clear();this.disposed=true;this.buffers.clear();this.context=null;}
}
