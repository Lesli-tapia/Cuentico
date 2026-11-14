'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, LockKeyhole } from 'lucide-react';
import { Shell, PageTitle, RequireProfile, ProgressBar, EmptyState } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { catalog, stories } from '@/modules/content/types';
import { StoryCard } from '@/modules/stories/story-card';
export default function LibraryView({ favorites = false }: { favorites?: boolean }) {
  const exploring=usePathname()==='/explorar';
  const [query, setQuery] = useState(''); const { state } = useApp();
  const filtered = stories.filter(s => (!favorites || state?.favorites.includes(s.id)) && s.title.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  const completed = state?.progress.filter(p => p.status === 'Completed').length ?? 0;
  return <RequireProfile><Shell><PageTitle title={favorites ? 'Mis favoritos' : 'Mi librería'} subtitle={favorites ? 'Las historias que más nos encantan' : 'Todas tus historias en un solo lugar'} />
    {!favorites && <><label className="search-box"><Search aria-hidden="true" /><input type="search" aria-label="Buscar un cuento" placeholder="Buscar un cuento…" value={query} onChange={e => setQuery(e.target.value)} /></label></>}
    {filtered.length ? <div className={favorites ? "favorites-grid" : "story-list"}>{filtered.map(s => favorites ? <Link className="favorite-tile" key={s.id} href={`/cuentos/${s.id}`}><img src={s.cover} alt="" /><h2>{s.title}</h2></Link> : <StoryCard story={s} key={s.id} />)}</div> : <EmptyState title={favorites ? 'Guarda tus cuentos favoritos' : 'Busquemos otra historia'}>{favorites ? 'Pulsa el corazón de un cuento para encontrarlo aquí fácilmente.' : 'Prueba con otra palabra o borra la búsqueda.'}</EmptyState>}
    {!favorites && !query && <div className="pending-content"><LockKeyhole size={20} aria-hidden="true" /><div><strong>Una nueva aventura, próximamente</strong><p>Aún no disponible</p></div></div>}
    {exploring && <section className="stack"><h2>Actividades pendientes</h2>{state?.attempts.filter(a=>a.status==='Pending').map(a=>{const session=state.sessions.find(s=>s.id===a.sessionId&&s.status==='Completed');const story=stories.find(s=>s.id===session?.storyId);return story&&<Link className="card" key={a.id} href={'/cuentos/'+story.id+'/actividad?sesion='+session?.id}>{story.activity?.title} · {story.title}</Link>})}</section>}
    <p className="library-name">{catalog.library.title}</p>
  </Shell></RequireProfile>;
}
