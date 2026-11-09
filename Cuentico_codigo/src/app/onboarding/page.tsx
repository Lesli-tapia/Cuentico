'use client';

import { useApp } from '@/components/app-provider';
import { useState } from 'react';
import { AdultGate, Logo, PageTitle, Shell } from '@/components/ui';
import ProfileForm from '@/modules/profiles/profile-form';

export default function OnboardingPage() {
  const { state, loading } = useApp();
  if (loading) return <div className="loading-screen"><Logo /><p role="status">Preparando nuestra aventura…</p></div>;
  return <OnboardingContent hasFamily={Boolean(state?.family)} />;
}

function OnboardingContent({ hasFamily }: { hasFamily: boolean }) {
  // Creating the first profile updates family state before navigation finishes.
  // Keep the original adult-entry context stable during that transition.
  const [requiresAdultGate] = useState(hasFamily);
  const form = <div className="stack"><PageTitle title="Las mejores aventuras empiezan juntos" subtitle="Para la persona adulta: preparemos un momento de lectura para compartir." /><ProfileForm /></div>;
  return <Shell immersive>{requiresAdultGate ? <AdultGate title="Añadir un lector a la familia">{form}</AdultGate> : form}</Shell>;
}
