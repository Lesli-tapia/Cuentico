'use client';
import Link from 'next/link';
import { ArrowRight, Clock3, Heart, Check } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { ProgressBar } from '@/components/ui';
import type { Story } from '@/modules/content/types';
export function StoryCard({ story, compact = false }: { story: Story; compact?: boolean }) {
  const { state, command } = useApp(); const progress = state?.progress.find(p => p.storyId === story.id);
  const pending = state?.attempts.some(a => a.status === 'Pending' && state.sessions.some(s => s.id === a.sessionId && s.storyId === story.id && s.status === 'Completed'));
  const status = progress?.status === 'Completed' ? 'Leído' : progress ? 'En progreso' : 'Por leer';
  const favorite = state?.favorites.includes(story.id);
  return <article className={`story-card ${compact ? 'compact' : ''}`}>
    <Link href={`/cuentos/${story.id}`} className="story-image-link" tabIndex={-1} aria-hidden="true"><img src={story.cover} alt="" loading="lazy" /></Link>
    <div className="story-card-copy"><Link className="story-title" href={`/cuentos/${story.id}`}><h2>{story.title}</h2></Link>
      {compact ? <span className="badge">{story.theme}</span> : <><p className="story-meta"><Clock3 size={15} aria-hidden="true" /> {story.durationMinutes} min · {status}</p><ProgressBar label={`Progreso de ${story.title}`} value={progress?.status === 'Completed' ? 100 : progress ? ((progress.lastSceneIndex + 1) / story.scenes.length) * 100 : 0} /><div className="story-status">{pending ? <span>Actividad pendiente</span> : progress?.status === 'Completed' ? <span><Check size={14} /> Actividad completada</span> : <span>{story.theme}</span>}</div></>}
      <Link href={`/cuentos/${story.id}`} className="text-link">{progress?.status === 'Completed' ? 'Volver a leer' : progress ? 'Continuar leyendo' : 'Ver cuento'} <ArrowRight size={18} aria-hidden="true" /></Link>
    </div>
    {!compact && <button className={`favorite-button ${favorite ? 'selected' : ''}`} aria-label={`${favorite ? 'Quitar de' : 'Guardar en'} favoritos: ${story.title}`} aria-pressed={favorite} onClick={() => { void command({ type: 'toggleFavorite', storyId: story.id }).catch(() => {}); }}><Heart size={20} fill={favorite ? 'currentColor' : 'none'} /></button>}
  </article>;
}
