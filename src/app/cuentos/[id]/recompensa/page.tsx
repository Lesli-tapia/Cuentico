import { Suspense } from 'react';
import CompletionView from '@/modules/rewards/completion-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Suspense fallback={<p role="status">Abriendo la aventura…</p>}><CompletionView id={id} step="recompensa" /></Suspense>; }
