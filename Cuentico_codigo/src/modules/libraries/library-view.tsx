'use client';
import { useState } from 'react';
import { Search, LockKeyhole } from 'lucide-react';
import { Shell, PageTitle, RequireProfile, ProgressBar, EmptyState } from '@/components/ui';
import { useApp } from '@/components/app-provider';
import { catalog, stories } from '@/modules/content/types';
import { StoryCard } from '@/modules/stories/story-card';
export default function LibraryView({ favorites = false }: { favorites?: boolean }) {
  const [query, setQuery] = useState(''); const { state } = useApp();
  const filtered = stories.filter(s => (!favorites || state?.favorites.includes(s.id)) && s.title.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  const completed = state?.progress.filter(p => p.status === 'Completed').length ?? 0;
  return <RequireProfile><Shell><PageTitle title={favorites ? 'Mis favoritos' : 'Mi librería'} subtitle={favorites ? 'Las historias que más nos encantan' : 'Tus historias y su progreso'} />
    {!favorites && <><div className="library-overview"><span className="badge">Librería gratuita</span><span>{completed} de {stories.length} cuentos leídos</span><ProgressBar label="Progreso global de la librería" value={completed / stories.length * 100} /></div><label className="search-box"><Search aria-hidden="true" /><input type="search" aria-label="Buscar un cuento" placeholder="Buscar un cuento…" value={query} onChange={e => setQuery(e.target.value)} /></label></>}
    {filtered.length ? <div className="story-list">{filtered.map(s => <StoryCard story={s} key={s.id} />)}</div> : <EmptyState title={favorites ? 'Guarda tus cuentos favoritos' : 'Busquemos otra historia'}>{favorites ? 'Pulsa el corazón de un cuento para encontrarlo aquí fácilmente.' : 'Prueba con otra palabra o borra la búsqueda.'}</EmptyState>}
    {!favorites && !query && <div className="pending-content"><LockKeyhole size={20} aria-hidden="true" /><div><strong>Una nueva aventura, próximamente</strong><p>Aún no disponible</p></div></div>}
    <p className="library-name">{catalog.library.title}</p>
  </Shell></RequireProfile>;
}
