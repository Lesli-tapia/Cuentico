'use client';
import { useState } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { Award, Star, Play, Clock3, Heart, Smile, Meh, Check, Sparkles } from 'lucide-react';
import { Shell, RequireProfile, Button, ActionLink, PageTitle, formatDuration } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { findStory } from '@/modules/content/types';
type Step = 'fin' | 'recompensa' | 'valoracion';
export default function CompletionView({ id, step }: { id: string; step: Step }) {
  const { state, command } = useApp(); const search = useSearchParams(); const router = useRouter(); const story = findStory(id);
  const [busy, setBusy] = useState(false); const [avatarSelected, setAvatarSelected] = useState(false);
  if (!story) return notFound();
  const session = state?.sessions.filter(s => s.storyId === id && s.status === 'Completed' && (!search.get('sesion') || s.id === search.get('sesion'))).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const attempt = state?.attempts.find(a => a.sessionId === session?.id);
  const suffix = `?sesion=${session?.id}`;
  async function defer() { if (!session) return; setBusy(true); try { await command({ type: 'deferActivity', sessionId: session.id }); router.push('/'); } catch { setBusy(false); } }
  async function rate(rating: 'LOVE' | 'LIKE' | 'NOT_FAVORITE') { setBusy(true); try { await command({ type: 'rateStory', storyId: id, rating }); router.push('/'); } catch { setBusy(false); } }
  return <RequireProfile><Shell back="/" immersive>{!session ? <><PageTitle title="Tu aventura te espera" /><ActionLink href={`/cuentos/${id}`}>Volver al cuento</ActionLink></> : <div className="completion-view">
    {step === 'fin' ? <><PageTitle title="¡Lectura completada!" /><div className="time-card"><Clock3 size={46} /><div><h2>Tiempo de lectura</h2><strong>{formatDuration(session.activeDurationSeconds)}</strong></div></div><section className="card celebration-card"><h2>¡La aventura continúa!</h2><p>¿Listos para jugar y descubrir cuánto aprendimos?</p><div className="activity-chip"><Sparkles size={24} />{story.activity?.title}</div></section><div className="stack"><ActionLink href={`/cuentos/${id}/${attempt?.status === 'Completed' ? 'recompensa' : 'actividad'}${suffix}`}><Play fill="currentColor" /> Comenzar actividad</ActionLink><Button className="soft" disabled={busy} onClick={() => void defer()}><Clock3 /> En otro momento</Button></div></> : step === 'recompensa' ? <><div className="reward-emblem"><Award size={58} /></div><PageTitle title="¡Desbloqueaste un nuevo personaje!" subtitle="Cada historia compartida deja algo especial." /><div className="character-reward"><img src={story.character!.image} alt={story.character!.name} /></div><h2>{story.character!.name}</h2><p>¡Puedes elegirlo para que acompañe tu perfil!</p><div className="stack"><Button className="secondary" disabled={busy || avatarSelected || state?.child?.avatarCharacterId === story.character!.id} onClick={async () => { setBusy(true); try { await command({ type: 'selectAvatar', characterId: story.character!.id }); setAvatarSelected(true); } catch {} finally { setBusy(false); } }}>{avatarSelected || state?.child?.avatarCharacterId === story.character!.id ? 'Avatar seleccionado' : 'Usar como perfil'}</Button><ActionLink href="/" secondary>Continuar</ActionLink></div></> : <><Star className="reward-star" fill="currentColor" /><PageTitle title="¿Qué les pareció el cuento?" subtitle={story.title} /><img className="rating-image" src={story.cover} alt={`Ilustración de ${story.title}`} /><div className="rating-buttons"><Button disabled={busy} onClick={() => void rate('LOVE')}><Heart /> Me encantó</Button><Button className="soft" disabled={busy} onClick={() => void rate('LIKE')}><Smile /> Me gustó</Button><Button className="secondary" disabled={busy} onClick={() => void rate('NOT_FAVORITE')}><Meh /> No fue mi favorito</Button></div><ActionLink href="/" secondary>Omitir por ahora</ActionLink></>}
  </div>}</Shell></RequireProfile>;
}
