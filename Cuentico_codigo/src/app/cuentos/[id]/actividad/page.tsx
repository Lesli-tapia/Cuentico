import { Suspense } from 'react';
import ActivityView from '@/modules/activities/activity-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Suspense fallback={<p role="status">Abriendo la aventura…</p>}><ActivityView id={id} /></Suspense>; }
