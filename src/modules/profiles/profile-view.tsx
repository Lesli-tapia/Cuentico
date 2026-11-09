'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Puzzle, Settings, Users, ChevronRight, Star, Award } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { AdultGate, Avatar, Button, formatDuration, PageTitle } from '@/components/ui';
import ProfileForm from './profile-form';

export default function ProfileView() {
  const { state, command } = useApp();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!state?.child) return null;
  const child = state.child;
  const completed = state.progress.filter(progress => progress.status === 'Completed').length;
  const completedActivities = state.attempts.filter(attempt => attempt.status === 'Completed').length;
  const totalSeconds = state.sessions.reduce((sum, session) => sum + session.activeDurationSeconds, 0);
  async function switchProfile(childId: string) {
    setChanging(true); setError(null);
    try { await command({ type: 'switchProfile', childId }); setEditing(false); setAdding(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos cambiar de lector.'); }
    finally { setChanging(false); }
  }

  return <div className="stack">
    <PageTitle title="Mi perfil" subtitle="Cada lectura nos hace crecer." />
    <section className="card profile-card">
      <Avatar /><div><span className="eyebrow">Nuestro lector</span><h2>{child.name}</h2><p>{child.age} años · {child.interests.join(', ')}</p></div>
    </section>
    <section className="stats" aria-label="Tu progreso de lectura">
      <div className="card"><BookOpen aria-hidden="true" /><strong>{completed}</strong><span>Cuentos completados</span></div>
      <div className="card"><Clock aria-hidden="true" /><strong>{formatDuration(totalSeconds)}</strong><span>Tiempo compartido</span></div>
      <div className="card"><Puzzle aria-hidden="true" /><strong>{completedActivities}</strong><span>Actividades completadas</span></div>
      <div className="card"><Award aria-hidden="true" /><strong>{state.unlocks.length}</strong><span>Amigos descubiertos</span></div>
    </section>
    <section className="card stack"><div><span className="eyebrow"><Award size={20} aria-hidden="true" /> Mi colección</span><h2>Amigos de nuestras aventuras</h2><p>Ya conoces a {state.unlocks.length} {state.unlocks.length === 1 ? 'personaje' : 'personajes'}. Elige uno como tu avatar.</p></div><Link className="button" href="/coleccion">Ver mi colección <ChevronRight size={20} aria-hidden="true" /></Link></section>
    <Link className="card profile-card" href="/favoritos"><Star aria-hidden="true" /><div><h2>Mis favoritos</h2><p>{state.favorites.length} {state.favorites.length === 1 ? 'cuento para volver a disfrutar' : 'cuentos para volver a disfrutar'}</p></div><ChevronRight aria-hidden="true" /></Link>
    <section className="card stack"><h2><Settings size={22} aria-hidden="true" /> Espacio para adultos</h2><p>Organiza la rutina de cada lector y las preferencias de sonido, accesibilidad y recordatorios de la familia.</p><Button className="secondary" onClick={() => setEditing(value => !value)}>{editing ? 'Cerrar configuración' : 'Abrir configuración'}</Button></section>
    {editing && <AdultGate key={child.id}>
      <section className="card stack"><h2><Users size={22} aria-hidden="true" /> Lectores de la familia</h2><div className="check-group">{state.profiles.map(profile => <Button key={profile.id} type="button" className={profile.id === child.id ? '' : 'secondary'} disabled={changing || profile.id === child.id} onClick={() => void switchProfile(profile.id)} aria-label={`Cambiar al perfil de ${profile.name}`}>{profile.name}{profile.id === child.id ? ' · Actual' : ''}</Button>)}</div><Button className="secondary" type="button" onClick={() => setAdding(value => !value)}>{adding ? 'Volver a la configuración' : 'Añadir otro lector'}</Button></section>
      {error && <p role="alert" className="card">{error}</p>}
      {adding ? <section className="stack"><PageTitle title="Un nuevo lector" subtitle="Crea su propio perfil para guardar sus aventuras." /><ProfileForm key="new" mode="create" onSaved={() => { setAdding(false); setEditing(false); }} /></section> : <section className="stack"><h2>Configuración de {child.name}</h2><ProfileForm key={child.id} mode="update" initial={{ name: child.name, age: child.age, interests: child.interests, plan: state.plan, preferences: state.preferences }} onSaved={() => setEditing(false)} /></section>}
    </AdultGate>}
  </div>;
}
