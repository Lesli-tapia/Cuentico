'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { Avatar, Button, PageTitle } from '@/components/ui';
import ProfileForm from './profile-form';

export default function SettingsView() {
  const { state, command } = useApp();
  const [adding, setAdding] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!state?.child) return null;
  const child = state.child;
  async function switchProfile(childId: string) {
    setChanging(true); setError(null);
    try { await command({ type: 'switchProfile', childId }); setAdding(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos cambiar de lector.'); }
    finally { setChanging(false); }
  }

  return <div className="stack">
    <PageTitle title="Configuraciones" />
    <section className="card profile-card">
      <Avatar /><div><span className="eyebrow">Nuestro lector</span><h2>{child.name}</h2><p>{child.age} años · {child.interests.join(', ')}</p></div>
    </section>
    <div key={child.id}>
      <section className="card stack"><h2><Users size={22} aria-hidden="true" /> Lectores de la familia</h2><div className="check-group">{state.profiles.map(profile => <Button key={profile.id} type="button" className={profile.id === child.id ? '' : 'secondary'} disabled={changing || profile.id === child.id} onClick={() => void switchProfile(profile.id)} aria-label={`Cambiar al perfil de ${profile.name}`}>{profile.name}{profile.id === child.id ? ' · Actual' : ''}</Button>)}</div><Button className="secondary" type="button" onClick={() => setAdding(value => !value)}>{adding ? 'Volver a la configuración' : 'Añadir otro lector'}</Button></section>
      {error && <p role="alert" className="card">{error}</p>}
      {adding ? <section className="stack"><PageTitle title="Un nuevo lector" subtitle="Crea su propio perfil para guardar sus aventuras." /><ProfileForm key="new" mode="create" onSaved={() => { setAdding(false); }} /></section> : <section className="stack"><h2>Configuración de {child.name}</h2><ProfileForm key={child.id} mode="update" initial={{ name: child.name, age: child.age, interests: child.interests, plan: state.plan, preferences: state.preferences }} onSaved={() => setAdding(false)} /></section>}
    </div>
  </div>;
}
