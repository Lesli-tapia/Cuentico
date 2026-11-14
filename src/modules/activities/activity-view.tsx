'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { ArrowUp, ArrowDown, Check, GripVertical, Heart, Sparkles } from 'lucide-react';
import { Shell, RequireProfile, Button, PageTitle, ActionLink } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { findStory, type Story } from '@/modules/content/types';
import { ActiveClock } from '@/modules/reader/active-clock';
import { seededShuffle } from './domain';
import type { Session } from '@/core/contracts';
export default function ActivityView({ id }: { id: string }) {
  const { state } = useApp(); const search = useSearchParams(); const story = findStory(id);
  if (!story) return notFound();
  const session = state?.sessions.filter(s => s.storyId === id && s.status === 'Completed' && (!search.get('sesion') || s.id === search.get('sesion'))).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  return <RequireProfile>{session ? <ActivityEngine key={session.id} story={story} session={session} /> : <Shell back="/"><PageTitle title="Primero, una aventura" subtitle="Esta actividad acompaña un cuento completado." /><ActionLink href={`/cuentos/${id}`}>Ir al cuento</ActionLink></Shell>}</RequireProfile>;
}
function ActivityEngine({ story, session }: { story: Story; session: Session }) {
  const { state, command } = useApp(); const router = useRouter(); const activity = story.activity!;
  const [order, setOrder] = useState(() => seededShuffle(activity.sceneIds, session.id));
  const [dragged, setDragged] = useState<number | null>(null); const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(''); const [correct, setCorrect] = useState(false);
  const steps = activity.type === 'GUESS_CHARACTER' ? [['Elige un personaje','El niño piensa en uno de los personajes de la historia.'],['¡A actuar!','Representa al personaje utilizando gestos o movimientos, sin decir su nombre.'],['Adivina quién es','El padre intenta descubrir qué personaje está representando.'],['Intercambien turnos','Ahora le toca al padre representar un personaje.']] : activity.type === 'FAVORITE_MOMENT' ? [['Recuerden la historia','Piensen en las escenas que más llamaron su atención.'],['Comparte tu momento favorito','El niño cuenta cuál fue su parte favorita.'],['Escucha otra opinión','El padre comparte su escena favorita.'],['Conversen juntos','Expliquen por qué eligieron esos momentos.']] : [['Observa las imágenes','Mira las escenas de la historia.'],['Ordena los momentos','Arrastra las ilustraciones para colocarlas según el orden en que sucedieron.'],['Comprueba tu respuesta','Revisa si la secuencia es correcta.']];
  const activityClock=useRef<ActiveClock|null>(null);
  const commandRef=useRef(command);commandRef.current=command;
  useEffect(()=>{const initial=state?.metrics?.find(m=>m.sessionId===session.id&&m.kind==='ActivityTime')?.value??0;const clock=new ActiveClock(initial);activityClock.current=clock;clock.setVisible(!document.hidden);const save=()=>commandRef.current({type:'recordMetric',sessionId:session.id,eventId:'time',kind:'ActivityTime',value:clock.seconds()}).catch(()=>{});const visible=()=>{clock.setVisible(!document.hidden);if(document.hidden)void save()};const activity=()=>clock.activity();void commandRef.current({type:'recordMetric',sessionId:session.id,eventId:'start',kind:'ActivityStarted'}).catch(()=>{});const timer=setInterval(()=>{clock.seconds();void save()},5000);document.addEventListener('visibilitychange',visible);window.addEventListener('pointerdown',activity);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('pointerdown',activity);void save()};},[session.id]);
  const attempt = state?.attempts.find(a => a.sessionId === session.id);
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || busy || correct) return;
    setOrder(current => { const copy = [...current]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy; }); setFeedback('');
  }
  async function complete() {
    setBusy(true); setFeedback('');
    try {
      await command({type:'recordMetric',sessionId:session.id,eventId:'time',kind:'ActivityTime',value:activityClock.current?.seconds()??0});
      const response = await command({ type: 'completeActivity', sessionId: session.id, ...(activity.type === 'SEQUENCE' ? { order } : {}) });
      if (response.result?.correct === false) setFeedback('¡Buen intento! Piensen qué pasó primero y vuelvan a probar.');
      else if (activity.type === 'SEQUENCE') { setCorrect(true); setFeedback('¡Lo lograron! La aventura está en orden.'); }
      else router.push(`/cuentos/${story.id}/recompensa?sesion=${session.id}`);
    } catch {} finally { setBusy(false); }
  }
  if (attempt?.status === 'Completed' && !correct) return <Shell back="/" immersive><PageTitle title="¡Ya compartieron este juego!" /><ActionLink href={`/cuentos/${story.id}/recompensa?sesion=${session.id}`}>Ver recompensa</ActionLink></Shell>;
  return <Shell back="/" immersive><div className="activity-view"><PageTitle title={activity.title} subtitle="Un juego para compartir en familia" />
    <ol className="activity-steps">{steps.map(([title,text])=><li className="card" key={title}><h2>{title}</h2><p>{text}</p></li>)}</ol><p className="activity-note">No olvides informarnos cuando terminen</p>
    {activity.type === 'SEQUENCE' ? <><div className="activity-instruction"><GripVertical size={32} /><p><strong>Mueve las imágenes</strong> en el orden de la historia. También puedes usar las flechas.</p></div><div className="sequence-grid">{order.map((sceneId, index) => {
      const scene = story.scenes.find(s => s.id === sceneId)!;
      return <article key={sceneId} className={`sequence-card ${correct ? 'correct' : ''}`} draggable={!correct && !busy} onDragStart={e => { setDragged(index); e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={e => e.preventDefault()} onDragEnd={() => setDragged(null)} onDrop={e => { e.preventDefault(); if (dragged !== null) move(dragged, index); setDragged(null); }}><span className="sequence-number" aria-label={`Posición ${index + 1}`}>{index + 1}</span><img draggable={false} src={scene.image} alt={`Escena ilustrada: ${scene.paragraphs[0]}`} /><div className="sequence-move"><button className="icon-button" aria-label={`Mover tarjeta ${index + 1} antes`} disabled={index === 0 || busy || correct} onClick={() => move(index, index - 1)}><ArrowUp size={20} /></button><GripVertical aria-hidden="true" /><button className="icon-button" aria-label={`Mover tarjeta ${index + 1} después`} disabled={index === order.length - 1 || busy || correct} onClick={() => move(index, index + 1)}><ArrowDown size={20} /></button></div></article>;
    })}</div>{feedback && <p role="status" className={`activity-feedback ${correct ? 'success' : ''}`}>{feedback}</p>}{correct ? <ActionLink href={`/cuentos/${story.id}/recompensa?sesion=${session.id}`}><Sparkles /> Ya terminamos la actividad</ActionLink> : <Button disabled={busy} onClick={() => void complete()}><Check />{busy ? 'Comprobando…' : 'Comprobar orden'}</Button>}</> : <>
      {activity.type === 'FAVORITE_MOMENT' && <div className="activity-instruction"><Heart size={36} /><h2>¿Qué escena les gustó más y por qué?</h2></div>}
      {activity.type === 'FAVORITE_MOMENT' && <img className="activity-hero" src={story.scenes[0].image} alt={story.title}/>}
      <section className="card conversation-card">{activity.type === 'FAVORITE_MOMENT' ? <><h2>¡Conversemos!</h2><p>Primero cuéntalo tú, luego escucha el momento favorito de tu familia.</p><p>¿Qué pasó en esa escena? ¿Por qué fue especial para ustedes?</p></> : <><h2>¡A jugar a los personajes!</h2><ol><li>El niño elige un personaje del cuento.</li><li>Lo representa sin decir su nombre.</li><li>La persona adulta intenta adivinarlo.</li><li>¡Intercambien turnos!</li></ol></>}</section><p className="muted activity-note">No olvides informarnos cuando terminen</p><Button disabled={busy} onClick={() => void complete()}><Check />{busy ? 'Guardando…' : 'Ya terminamos la actividad'}</Button>
    </>}<button className="text-link later-link" disabled={busy} onClick={async () => { setBusy(true); try { await command({ type: 'deferActivity', sessionId: session.id }); router.push('/'); } catch { setBusy(false); } }}>Continuar más tarde</button></div></Shell>;
}
