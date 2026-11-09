import { Suspense } from 'react';
import ReaderView from '@/modules/reader/reader-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Suspense fallback={<p role="status">Abriendo la aventura…</p>}><ReaderView id={id} /></Suspense>; }
