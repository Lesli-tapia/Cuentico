'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="loading-screen"><h1>Hagamos una pequeña pausa</h1><p>No pudimos abrir esta página. Tu progreso guardado sigue en la biblioteca.</p><button className="button" onClick={reset}>Volver a intentar</button><a href="/">Ir al inicio</a></main>; }
