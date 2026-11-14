'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Puzzle, Settings, Users, ChevronRight, Star, Award } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { AdultGate, Avatar, Button, formatDuration, PageTitle } from '@/components/ui';
import ProfileForm from './profile-form';

export default function SettingsView() {
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
    <PageTitle title="Configuraciones" />
    <section className="card profile-card">
      <Avatar /><div><span className="eyebrow">Nuestro lector</span><h2>{child.name}</h2><p>{child.age} años · {child.interests.join(', ')}</p></div>
    </section>
    <section className="card stack"><h2><Settings size={22} aria-hidden="true" /> Espacio para adultos</h2><p>Organiza la rutina de cada lector y las preferencias de sonido, accesibilidad y recordatorios de la familia.</p><Button className="secondary" onClick={() => setEditing(value => !value)}>{editing ? 'Cerrar configuración' : 'Abrir configuración'}</Button></section>
    {editing && <AdultGate key={child.id}>
      <section className="card stack"><h2><Users size={22} aria-hidden="true" /> Lectores de la familia</h2><div className="check-group">{state.profiles.map(profile => <Button key={profile.id} type="button" className={profile.id === child.id ? '' : 'secondary'} disabled={changing || profile.id === child.id} onClick={() => void switchProfile(profile.id)} aria-label={`Cambiar al perfil de ${profile.name}`}>{profile.name}{profile.id === child.id ? ' · Actual' : ''}</Button>)}</div><Button className="secondary" type="button" onClick={() => setAdding(value => !value)}>{adding ? 'Volver a la configuración' : 'Añadir otro lector'}</Button></section>
      {error && <p role="alert" className="card">{error}</p>}
      {adding ? <section className="stack"><PageTitle title="Un nuevo lector" subtitle="Crea su propio perfil para guardar sus aventuras." /><ProfileForm key="new" mode="create" onSaved={() => { setAdding(false); setEditing(false); }} /></section> : <section className="stack"><h2>Configuración de {child.name}</h2><ProfileForm key={child.id} mode="update" initial={{ name: child.name, age: child.age, interests: child.interests, plan: state.plan, preferences: state.preferences }} onSaved={() => setEditing(false)} /></section>}
    </AdultGate>}
  </div>;
}
