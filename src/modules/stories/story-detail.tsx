'use client';
import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Clock3, Heart, Play, ArrowRight } from 'lucide-react';
import { Shell, RequireProfile, Button, ActionLink, ProgressBar } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { findStory } from '@/modules/content/types';
export default function StoryDetail({ id }: { id: string }) {
  const story = findStory(id); const { state, command } = useApp(); const [saving, setSaving] = useState(false);
  if (!story) return notFound();
  const progress = state?.progress.find(p => p.storyId === id); const favorite = state?.favorites.includes(id);
  return <RequireProfile><Shell back="/libreria" immersive><div className="story-detail"><img className="detail-cover" src={story.cover} alt={`Ilustración de ${story.title}`} /><div className="detail-copy"><h1>{story.title}</h1><p className="synopsis">{story.description}</p>{progress && <div className="detail-progress"><p>{progress.status === 'Completed' ? '¡Ya compartieron esta aventura!' : `Continúa desde la escena ${progress.lastSceneIndex + 1} de ${story.scenes.length}`}</p><ProgressBar label="Tu progreso en este cuento" value={progress.status === 'Completed' ? 100 : (progress.lastSceneIndex + 1) / story.scenes.length * 100} /></div>}<div className="stack"><ActionLink href={`/cuentos/${id}/preparacion${progress?.status === 'Completed' ? '?releer=1' : ''}`}><Play size={22} />{progress?.status === 'Completed' ? 'Volver a leer' : progress ? 'Continuar lectura' : 'Comenzar lectura'}</ActionLink><Button className="secondary" disabled={saving} aria-pressed={favorite} onClick={async () => { setSaving(true); try { await command({ type: 'toggleFavorite', storyId: id }); } catch {} finally { setSaving(false); } }}><Heart size={22} fill={favorite ? 'currentColor' : 'none'} />{favorite ? 'Guardado en favoritos' : 'Guardar en favoritos'}</Button></div></div></div></Shell></RequireProfile>;
}
