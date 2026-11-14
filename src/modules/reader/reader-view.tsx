'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lightbulb, Volume2, VolumeX, Pause, Play, LogOut } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { RequireProfile, ProgressBar, Button, Dialog, TipCard } from '@/components/ui';
import { findStory, tips, type Story } from '@/modules/content/types';
import type { Session } from '@/core/contracts';
import { ActiveClock } from './active-clock';
import { SceneEventPlayer } from './scene-events';
export default function ReaderView({ id }: { id: string }) {
  const { state } = useApp(); const search = useSearchParams(); const story = findStory(id);
  const session = state?.sessions.filter(s => s.storyId === id && (!search.get('sesion') || s.id === search.get('sesion'))).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (!story) return notFound();
  return <RequireProfile>{session ? <ReaderEngine key={session.id} session={session} story={story} /> : <div className="loading-screen"><h1>Preparemos la lectura</h1><Link className="button" href={`/cuentos/${id}/preparacion`}>Ir a la preparación</Link></div>}</RequireProfile>;
}
function ReaderEngine({ session, story }: { session: Session; story: Story }) {
  const { state, command } = useApp(); const router = useRouter();
  const [sceneIndex, setSceneIndex] = useState(Math.max(0, Math.min(session.lastSceneIndex, story.scenes.length - 1))); const sceneRef = useRef(sceneIndex);
  const [paused, setPaused] = useState(false); const [busy, setBusy] = useState(false); const [showTip, setShowTip] = useState(false);
  const pausedRef = useRef(false); const [confirmExit,setConfirmExit]=useState(false); const [textSize,setTextSize]=useState('Mediano'); const [showText,setShowText]=useState(false); const [sound,setSound]=useState(true);
  const [audioNote, setAudioNote] = useState(false); const [tipIndex, setTipIndex] = useState(0);
  const [animation, setAnimation] = useState(''); const [elapsed, setElapsed] = useState(session.activeDurationSeconds);
  const clock = useRef<ActiveClock | null>(null); const player = useRef<SceneEventPlayer | null>(null);
  const commandRef = useRef(command); commandRef.current = command;
  const scene = story.scenes[sceneIndex]; const muted = !sound;
  const reduced = (state?.preferences.reducedMotion ?? false);
  const save = useCallback(async (pause = false) => commandRef.current({ type: 'saveReading', sessionId: session.id, sceneIndex: sceneRef.current, activeDurationSeconds: clock.current?.seconds() ?? session.activeDurationSeconds, pause }), [session.id, session.activeDurationSeconds]);
  useEffect(() => {
    clock.current = new ActiveClock(session.activeDurationSeconds); clock.current.setVisible(!document.hidden);
    player.current = new SceneEventPlayer(muted);
    const activity = () => clock.current?.activity();
    const visibility = () => { clock.current?.setVisible(!document.hidden); if (document.hidden) { player.current?.clear(); void save(true).catch(() => {}); } };
    const flush = () => { const payload = { type: 'saveReading', sessionId: session.id, sceneIndex: sceneRef.current, activeDurationSeconds: clock.current?.seconds() ?? session.activeDurationSeconds, pause: true }; navigator.sendBeacon('/api/app', new Blob([JSON.stringify(payload)], { type: 'application/json' })); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', flush);
    window.addEventListener('pointerdown', activity); window.addEventListener('keydown', activity);
    const tick = setInterval(() => setElapsed(clock.current?.seconds() ?? 0), 1000);
    const autosave = setInterval(() => { if (!document.hidden) void save(pausedRef.current).catch(() => {}); }, 10_000);
    return () => { flush(); clearInterval(tick); clearInterval(autosave); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', flush); window.removeEventListener('pointerdown', activity); window.removeEventListener('keydown', activity); player.current?.dispose(); };
    // A session owns one clock. Server snapshots must not reset it on each autosave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);
  useEffect(() => { player.current?.setMuted(muted); }, [muted]);
  useEffect(() => {
    setAnimation(''); player.current?.clear();
    if (!paused) player.current?.trigger(scene.events, 'ON_SCENE_ENTER', reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches, event => setAnimation(event.eventType === 'PARTICLE_EFFECT' ? 'scene-particles' : 'scene-enter'));
    return () => player.current?.clear();
  }, [scene, paused, reduced]);
  async function navigate(next: number) {
    if (busy) return; setBusy(true); clock.current?.activity();
    try {
      sceneRef.current = next; await save(); setSceneIndex(next); setShowTip(false); window.scrollTo({ top: 0, behavior: 'instant' });
    } catch { sceneRef.current = sceneIndex; } finally { setBusy(false); }
  }
  async function finish() {
    setBusy(true); clock.current?.setPaused(true);
    try { await save(); await command({ type: 'finishReading', sessionId: session.id, activeDurationSeconds: clock.current?.seconds() ?? elapsed }); router.push(`/cuentos/${story.id}/fin?sesion=${session.id}`); }
    catch { clock.current?.setPaused(false); setBusy(false); }
  }
  async function exit() { setBusy(true); clock.current?.setPaused(true); try { await save(true); player.current?.clear(); router.push('/libreria'); } catch { setBusy(false); clock.current?.setPaused(false); } }
  if (session.status === 'Completed') return <div className="loading-screen"><h1>¡Esta lectura está completada!</h1><Link className="button" href={`/cuentos/${story.id}/fin?sesion=${session.id}`}>Ver mi aventura</Link><Link href={`/cuentos/${story.id}`}>Volver al cuento</Link></div>;
  return <div className="reader-shell"><header className="reader-header"><button className="icon-button" onClick={() => setConfirmExit(true)} disabled={busy} aria-label="Volver a la librería"><ArrowLeft /></button><h1>{story.title}</h1><button className="icon-button" aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'} aria-pressed={!muted} onClick={() => { void player.current?.unlock(); setAudioNote(!story.scenes.some(s => s.events.some(e => e.asset && (e.eventType === 'SOUND_EFFECT' || e.eventType === 'AMBIENT_AUDIO')))); setSound(muted); }}>{muted ? <VolumeX /> : <Volume2 />}</button><button className="icon-button" aria-label="Consejos para padres" onClick={() => { setTipIndex(i => i + 1); setShowTip(true); }}><Lightbulb /></button><button className="icon-button" aria-label="Tamaño de texto" onClick={()=>setShowText(true)}>Aa</button></header>
    <main id="main-content"><div className="page-dots" aria-label="Páginas del cuento">{story.scenes.map((item,i)=><span key={item.id} className={i===sceneIndex?'current':''} aria-current={i===sceneIndex?'step':undefined} aria-label={'Página '+(i+1)}/>)}</div>
    {audioNote && <div role="status" className="audio-note">Este cuento no tiene sonido. Podemos darle voz juntos.<button onClick={() => setAudioNote(false)} aria-label="Cerrar aviso de sonido">×</button></div>}
    {paused ? <section className="pause-card card"><Pause size={40} /><h2>Una pausa en la aventura</h2><p>El reloj está en pausa. Continúen cuando estén listos.</p><Button onClick={() => { pausedRef.current = false; clock.current?.setPaused(false); setPaused(false); void save(false).catch(() => {}); }}><Play /> Reanudar lectura</Button></section> : <div className="reader-scene" key={scene.id}><button className={`scene-image ${animation}`} aria-label={`Ilustración de la escena ${sceneIndex + 1}`} onClick={() => { void player.current?.unlock(); player.current?.trigger(scene.events, 'ON_USER_INTERACTION', reduced, e => setAnimation(e.eventType === 'PARTICLE_EFFECT' ? 'scene-particles' : 'scene-enter')); }}><img src={scene.image} alt={`Ilustración original de la escena ${sceneIndex + 1} de ${story.title}`} /></button><article className="scene-text" style={{fontSize:textSize==='Pequeño'?'1rem':textSize==='Grande'?'1.6rem':'1.25rem'}} aria-label={`Texto de la escena ${sceneIndex + 1}`}>{scene.paragraphs.map((text, i) => <p key={i}>{text}</p>)}</article></div>}
    <div className="reader-controls"><Button className="secondary" disabled={busy || paused || sceneIndex === 0} onClick={() => void navigate(sceneIndex - 1)}><ArrowLeft size={22} /> Anterior</Button>{sceneIndex < story.scenes.length - 1 ? <Button disabled={busy || paused} onClick={() => void navigate(sceneIndex + 1)}>Siguiente <ArrowRight size={22} /></Button> : <Button disabled={busy || paused} onClick={() => void finish()}>{busy ? 'Guardando…' : 'Terminar lectura'} <ArrowRight size={22} /></Button>}</div>
    </main>{confirmExit && <Dialog title="¿Quieres regresar a la librería?" close={()=>setConfirmExit(false)}><p>Guardaremos tu progreso para que puedas continuar después.</p><div className="stack"><Button onClick={()=>setConfirmExit(false)}>Seguir leyendo</Button><Button className="secondary" disabled={busy} onClick={()=>void exit()}>Volver a la librería</Button></div></Dialog>}{showText && <Dialog title="Tamaño de texto" close={()=>setShowText(false)}>{["Pequeño","Mediano","Grande"].map(size=><Button key={size} className={textSize===size?"":"secondary"} aria-pressed={textSize===size} onClick={()=>{setTextSize(size);setShowText(false)}}>{size}</Button>)}</Dialog>}{showTip && <Dialog title="Un consejo durante la lectura" close={() => setShowTip(false)}><TipCard during text={tips.during[tipIndex % tips.during.length]} /><Button onClick={() => setTipIndex(i => i + 1)}>Otro consejo</Button></Dialog>}
  </div>;
}
