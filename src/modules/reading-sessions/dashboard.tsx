'use client';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, BookOpen, Bell, Award, Check } from 'lucide-react';
import { Shell, PageTitle, RequireProfile, ProgressBar } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { stories, findStory } from '@/modules/content/types';
import { StoryCard } from '@/modules/stories/story-card';
import { recommendStory, pendingActivities, dueReminders } from './selectors';
export default function Dashboard() {
  const { state, command } = useApp();
  const progress = state?.progress ?? [];
  const recommended = recommendStory(state);
  const completed = progress.filter(p => p.status === 'Completed').length;
  const pending = pendingActivities(state);
  const reminders = dueReminders(state);
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return <RequireProfile><Shell><PageTitle title={`¡Hola, ${state?.child?.name ?? 'explorador'}!`} subtitle="¿Qué historia vamos a descubrir hoy?" />
    <section className="recommended"><div className="recommended-copy"><span className="badge yellow"><Sparkles size={14} /> Para nuestra próxima lectura</span><h2>Una aventura<br />para compartir</h2><p>{recommended.title}</p><Link className="button coral" href={`/cuentos/${recommended.id}`}><Play size={20} />{progress.find(p => p.storyId === recommended.id)?.status === 'InProgress' ? 'Continuar' : 'Comenzar'}</Link></div><img src={recommended.cover} alt={`Ilustración de ${recommended.title}`} fetchPriority="high" /></section>
    <div className="dashboard-progress"><div><BookOpen size={20} /><strong>{completed} de {stories.length} aventuras compartidas</strong></div><ProgressBar value={completed / stories.length * 100} label="Cuentos completados" /><p>Cada historia es un momento juntos.</p></div>
    {pending.length > 0 && <section className="pending-activities"><div className="section-heading"><h2>Nos queda un juego</h2><span className="badge">{pending.length}</span></div>{pending.map(a => { const session = state?.sessions.find(s => s.id === a.sessionId); const story = findStory(session?.storyId ?? ''); return story && <Link className="pending-activity card" key={a.id} href={`/cuentos/${story.id}/actividad?sesion=${a.sessionId}`}><Sparkles /><div><strong>{story.activity?.title}</strong><p>{story.title}</p></div><ArrowRight /></Link>; })}</section>}
    {reminders.length > 0 && <section aria-label="Recordatorios" className="reminders"><h2><Bell size={22} /> Un momento para compartir</h2>{reminders.map(r => <div className="card reminder" key={r.id}><p>{r.message}</p><button aria-label="Marcar recordatorio como leído" className="icon-button" onClick={() => { void command({ type: 'readReminder', reminderId: r.id }).catch(() => {}); }}><Check /></button></div>)}</section>}
    <div className="section-heading"><div><h2>Continúa explorando</h2><p>Cuentos elegidos para leer juntos</p></div><Link href="/libreria" className="icon-button" aria-label="Ver toda la librería"><ArrowRight /></Link></div>
    <div className="story-list explore-list">{stories.filter(s => s.id !== recommended.id).map(s => <StoryCard key={s.id} story={s} compact />)}</div>
    <Link className="collection-link" href="/coleccion"><Award size={32} /><div><h2>Mi colección de personajes</h2><p>{state?.unlocks.length ?? 0} nuevos amigos en tu aventura</p></div><ArrowRight /></Link>
    <aside className="routine-note"><strong>Su momento de lectura</strong><p>{state?.plan.days.map(d => days[d]).join(', ')} · {state?.plan.time} · {state?.plan.minutes} min</p><Link href="/perfil">Cambiar la rutina en familia</Link></aside>
  </Shell></RequireProfile>;
}
