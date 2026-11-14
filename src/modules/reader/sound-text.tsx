'use client';
import {Fragment} from 'react';
import {Volume2,AudioLines} from 'lucide-react';
import type {SceneEvent} from '@/modules/content/types';
export function SoundText({text,events,playing,muted,onPlay}:{text:string;events:SceneEvent[];playing:SceneEvent|null;muted:boolean;onPlay:(event:SceneEvent)=>void}){
 const anchors=new Map<number,SceneEvent[]>();
 for(const event of events){if(!event.manual||!event.enabled||!event.asset||!event.anchor)continue;const index=text.toLocaleLowerCase('es').indexOf(event.anchor.toLocaleLowerCase('es'));if(index<0)continue;const end=index+event.anchor.length;anchors.set(end,[...(anchors.get(end)??[]),event]);}
 let previous=0;const pieces=[...anchors.entries()].sort((a,b)=>a[0]-b[0]).map(([end,cues])=>{const part=text.slice(previous,end);previous=end;return <Fragment key={end}>{part}{cues.map((event,i)=><button type="button" key={event.asset!+i} className={'inline-sound '+(playing===event?'is-playing':'')} aria-label={(playing===event?'Reproduciendo: ':'Escuchar: ')+(event.label??'Efecto de sonido')} aria-pressed={playing===event} disabled={muted} title={muted?'Activa el sonido en la barra superior':event.label} onClick={()=>onPlay(event)}>{playing===event?<AudioLines size={18} aria-hidden="true"/>:<Volume2 size={18} aria-hidden="true"/>}</button>)}</Fragment>});
 return <>{pieces}{text.slice(previous)}</>;
}
