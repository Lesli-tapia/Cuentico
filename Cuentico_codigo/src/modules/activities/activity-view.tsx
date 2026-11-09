'use client';
import { useState } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { ArrowUp, ArrowDown, Check, GripVertical, Heart, Sparkles } from 'lucide-react';
import { Shell, RequireProfile, Button, PageTitle, ActionLink } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { findStory, type Story } from '@/modules/content/types';
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
  const attempt = state?.attempts.find(a => a.sessionId === session.id);
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || busy || correct) return;
    setOrder(current => { const copy = [...current]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy; }); setFeedback('');
  }
  async function complete() {
    setBusy(true); setFeedback('');
    try {
      const response = await command({ type: 'completeActivity', sessionId: session.id, ...(activity.type === 'SEQUENCE' ? { order } : {}) });
      if (response.result?.correct === false) setFeedback('¡Buen intento! Piensen qué pasó primero y vuelvan a probar.');
      else if (activity.type === 'SEQUENCE') { setCorrect(true); setFeedback('¡Lo lograron! La aventura está en orden.'); }
      else router.push(`/cuentos/${story.id}/recompensa?sesion=${session.id}`);
    } catch {} finally { setBusy(false); }
  }
  if (attempt?.status === 'Completed' && !correct) return <Shell back="/" immersive><PageTitle title="¡Ya compartieron este juego!" /><ActionLink href={`/cuentos/${story.id}/recompensa?sesion=${session.id}`}>Ver recompensa</ActionLink></Shell>;
  return <Shell back="/" immersive><div className="activity-view"><PageTitle title={activity.title} subtitle="Un juego para compartir en familia" />
    {activity.type === 'SEQUENCE' ? <><div className="activity-instruction"><GripVertical size={32} /><p><strong>Mueve las imágenes</strong> en el orden de la historia. También puedes usar las flechas.</p></div><div className="sequence-grid">{order.map((sceneId, index) => {
      const scene = story.scenes.find(s => s.id === sceneId)!;
      return <article key={sceneId} className={`sequence-card ${correct ? 'correct' : ''}`} draggable={!correct && !busy} onDragStart={e => { setDragged(index); e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={e => e.preventDefault()} onDragEnd={() => setDragged(null)} onDrop={e => { e.preventDefault(); if (dragged !== null) move(dragged, index); setDragged(null); }}><span className="sequence-number" aria-label={`Posición ${index + 1}`}>{index + 1}</span><img draggable={false} src={scene.image} alt={`Escena ilustrada: ${scene.paragraphs[0]}`} /><div className="sequence-move"><button className="icon-button" aria-label={`Mover tarjeta ${index + 1} antes`} disabled={index === 0 || busy || correct} onClick={() => move(index, index - 1)}><ArrowUp size={20} /></button><GripVertical aria-hidden="true" /><button className="icon-button" aria-label={`Mover tarjeta ${index + 1} después`} disabled={index === order.length - 1 || busy || correct} onClick={() => move(index, index + 1)}><ArrowDown size={20} /></button></div></article>;
    })}</div>{feedback && <p role="status" className={`activity-feedback ${correct ? 'success' : ''}`}>{feedback}</p>}{correct ? <ActionLink href={`/cuentos/${story.id}/recompensa?sesion=${session.id}`}><Sparkles /> Ver recompensa</ActionLink> : <Button disabled={busy} onClick={() => void complete()}><Check />{busy ? 'Comprobando…' : 'Comprobar orden'}</Button>}</> : <>
      {activity.type === 'FAVORITE_MOMENT' && <div className="activity-instruction"><Heart size={36} /><h2>¿Qué escena les gustó más y por qué?</h2></div>}
      <img className="activity-hero" src={story.scenes[activity.type === 'GUESS_CHARACTER' ? 1 : 0].image} alt={`Ilustración de ${story.title}`} />
      <section className="card conversation-card">{activity.type === 'FAVORITE_MOMENT' ? <><h2>¡Conversemos!</h2><p>Primero cuéntalo tú, luego escucha el momento favorito de tu familia.</p><p>¿Qué pasó en esa escena? ¿Por qué fue especial para ustedes?</p></> : <><h2>¡A jugar a los personajes!</h2><ol><li>El niño elige un personaje del cuento.</li><li>Lo representa sin decir su nombre.</li><li>La persona adulta intenta adivinarlo.</li><li>¡Intercambien turnos!</li></ol></>}</section><p className="muted activity-note">Compartan el juego en persona. Al terminar, la familia confirma.</p><Button disabled={busy} onClick={() => void complete()}><Check />{busy ? 'Guardando…' : 'Ya completamos la actividad'}</Button>
    </>}<button className="text-link later-link" disabled={busy} onClick={async () => { setBusy(true); try { await command({ type: 'deferActivity', sessionId: session.id }); router.push('/'); } catch { setBusy(false); } }}>Continuar más tarde</button></div></Shell>;
}
