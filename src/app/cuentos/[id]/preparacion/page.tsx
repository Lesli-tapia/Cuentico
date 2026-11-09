import { Suspense } from 'react';
import PreparationView from '@/modules/reader/preparation-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Suspense fallback={<p role="status">Abriendo la aventura…</p>}><PreparationView id={id} /></Suspense>; }
