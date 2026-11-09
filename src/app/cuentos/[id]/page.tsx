import { Suspense } from 'react';
import StoryDetail from '@/modules/stories/story-detail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Suspense fallback={<p role="status">Abriendo la aventura…</p>}><StoryDetail id={id} /></Suspense>; }
