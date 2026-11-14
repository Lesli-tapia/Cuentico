'use client';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Shell, PageTitle, RequireProfile } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { recommendStory } from './selectors';
export default function Dashboard() {
 const {state}=useApp(); const story=recommendStory(state);
 const ongoing=state?.sessions.some(s=>s.storyId===story.id && s.status!=='Completed');
 const days=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
 return <RequireProfile><Shell><PageTitle title={'¡Hola, '+(state?.child?.name ?? 'explorador')+'!'} />
 <aside className="routine-note"><CalendarDays aria-hidden="true"/><div><strong>Rutina familiar</strong><p>{state?.plan.days.map(d=>days[d]).join(', ')} · {state?.plan.time} · {state?.plan.minutes} min</p><Link href="/configuraciones">Cambiar rutina</Link></div></aside>
 <section className="recommended"><div className="recommended-copy"><span className="badge yellow">Lectura del día</span><h1>{story.title}</h1><p>{story.durationMinutes} min · {story.theme}</p><Link className="button" href={'/cuentos/'+story.id}>{ongoing?'Continuar lectura':'Comenzar lectura'}</Link></div><img src={story.cover} alt={'Ilustración de '+story.title} fetchPriority="high"/></section>
 </Shell></RequireProfile>;
}
