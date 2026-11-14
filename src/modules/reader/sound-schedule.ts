import type {SceneEvent,StoryScene} from '@/modules/content/types';
import defaults from '../../../content/reading-audio.json';
export interface ReadingAudioOptions {wordsPerMinute:number;effectsVolume:number;minimumDelayMs:number;gapMs:number;maximumLatenessMs:number}
export const readingAudioDefaults:ReadingAudioOptions=defaults;
export function countWords(text:string):number{return text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length??0;}
export function readingTimeline(scene:Pick<StoryScene,'paragraphs'|'events'>,options:Partial<ReadingAudioOptions>={}) {
  const config={...defaults,...options};
  const speed=Math.min(300,Math.max(20,Number.isFinite(config.wordsPerMinute)?config.wordsPerMinute:defaults.wordsPerMinute));
  const text=scene.paragraphs.join(' '),words=countWords(text),durationMs=words/speed*60000;
  const sounds=scene.events.filter(e=>e.enabled&&!e.manual&&e.asset&&(e.eventType==='SOUND_EFFECT'||e.eventType==='AMBIENT_AUDIO'));
  let previousEnd=0;
  const cues=sounds.map((event,index)=>{
    const anchorIndex=event.anchor?text.toLocaleLowerCase('es').indexOf(event.anchor.toLocaleLowerCase('es')):-1;
    const offset=anchorIndex>=0?countWords(text.slice(0,anchorIndex)):event.wordOffset??(event.startFraction!==undefined?words*event.startFraction:event.delayMs/60000*140);
    const target=Math.max(config.minimumDelayMs,Math.min(words,Math.max(0,offset))/speed*60000);
    return {event,index,target};
  }).sort((a,b)=>a.target-b.target||a.index-b.index).map(({event,target})=>{
    const atMs=Math.max(target,previousEnd?previousEnd+config.gapMs:0);
    const duration=Math.max(100,Math.min(5000,event.durationMs||2500));
    previousEnd=atMs+duration;
    return {...event,delayMs:atMs,durationMs:duration};
  });
  return {wordCount:words,estimatedReadingMs:durationMs,wordsPerMinute:speed,cues};
}
