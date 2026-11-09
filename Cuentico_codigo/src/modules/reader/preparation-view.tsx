'use client';
import { useState } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { Play, Lightbulb } from 'lucide-react';
import { Shell, RequireProfile, Button, TipCard } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { findStory, tips } from '@/modules/content/types';
export default function PreparationView({ id }: { id: string }) {
  const story = findStory(id); const { command } = useApp(); const router = useRouter(); const search = useSearchParams();
  const [busy, setBusy] = useState(false); const [tipIndex, setTipIndex] = useState(0);
  if (!story) return notFound();
  return <RequireProfile><Shell back={`/cuentos/${id}`} immersive><section className="preparation"><h1>¡La aventura está por empezar!</h1><img src={story.cover} alt={`Ilustración de ${story.title}`} /><p className="muted">Un lugar cómodo y un ratito juntos.</p><TipCard text={tips.before[tipIndex % tips.before.length]} /><button className="text-link tip-next" onClick={() => setTipIndex(i => i + 1)}><Lightbulb size={18} /> Otro consejo</button><Button disabled={busy} onClick={async () => { setBusy(true); try { const response = await command({ type: 'startReading', storyId: id, reread: search.get('releer') === '1' }); router.push(`/cuentos/${id}/lectura?sesion=${response.result?.sessionId}`); } catch { setBusy(false); } }}><Play size={22} />{busy ? 'Abriendo el cuento…' : '¡Empezar a leer!'}</Button></section></Shell></RequireProfile>;
}
