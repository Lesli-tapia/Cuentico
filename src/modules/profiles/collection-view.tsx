'use client';

import { useState } from 'react';
import { Check, LockKeyhole, Sparkles } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { Button, PageTitle, ProgressBar } from '@/components/ui';
import { stories } from '@/modules/content/types';

const positions: Record<string, string> = {
  'alas-character': '50% 45%', 'nilo-character': '72% 64%', 'kiro-character': '25% 55%', 'tortas-character': '50% 45%'
};

export default function CollectionView() {
  const { state, command } = useApp();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!state?.child) return null;
  async function select(characterId: string, name: string) {
    setSaving(characterId); setError(null); setMessage(null);
    try { await command({ type: 'selectAvatar', characterId }); setMessage(`${name} es tu nuevo avatar.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos cambiar tu avatar.'); }
    finally { setSaving(null); }
  }
  return <div className="stack">
    <PageTitle title="Mi colección de personajes" subtitle="Un nuevo amigo te espera al completar cada cuento." />
    {error && <p className="card" role="alert">{error}</p>}{message && <p className="card" role="status">{message}</p>}
    <div className="story-grid">{stories.map(story => {
      const character = story.character;
      if (!character) return null;
      const unlock = state.unlocks.find(item => item.characterId === character.id);
      const selected = state.child?.avatarCharacterId === character.id;
      return <article key={character.id} className={`card character-card ${unlock ? 'unlocked' : 'locked'}`}>
        <div className="character-image"><img src={character.image} alt={unlock ? character.name : `Personaje por descubrir de ${story.title}`} style={{ objectPosition: positions[character.id], ...(!unlock ? { filter: 'brightness(0.2) grayscale(1)', opacity: 0.5 } : {}) }} />{!unlock && <span className="badge"><LockKeyhole size={16} aria-hidden="true" /> Por desbloquear</span>}</div>
        <h2>{character.name}</h2><p className="muted">{story.title}</p>
        {unlock ? <><small>Descubierto el {new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(unlock.unlockedAt))}</small><Button disabled={selected || saving !== null} onClick={() => void select(character.id, character.name)} aria-label={selected ? `${character.name}, avatar actual` : `Usar a ${character.name} como avatar`}>{selected ? <><Check size={20} aria-hidden="true" /> Avatar actual</> : saving === character.id ? 'Guardando…' : 'Usar como perfil'}</Button></> : <><p>Completa su cuento para descubrirlo.</p><Button className="secondary" disabled><LockKeyhole size={18} aria-hidden="true" /> Bloqueado</Button></>}
      </article>;
    })}</div>
  </div>;
}
