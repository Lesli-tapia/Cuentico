'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppResponse, AppState, Command } from '@/core/contracts';
type Store = { state: AppState | null; loading: boolean; error: string | null; dismissError: () => void; command: (input: Command) => Promise<AppResponse>; refresh: () => Promise<void> };
const Context = createContext<Store | null>(null);
async function readResponse(response: Response) {
  try { return await response.json(); }
  catch { throw new Error('No pudimos conectar con Cuentico. Espera un momento y vuelve a intentarlo.'); }
}
function readableError(cause: unknown, fallback: string) {
  return cause instanceof TypeError ? 'No pudimos conectar con Cuentico. Revisa que la aplicación esté en marcha.' : cause instanceof Error ? cause.message : fallback;
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state); stateRef.current = state;
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const requestedRevision = revision.current;
    try {
      const response = await fetch('/api/app', { cache: 'no-store' });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.error || 'No pudimos cargar tu progreso.');
      if (requestedRevision === revision.current) setState(data.state);
    } catch (cause) { setError(readableError(cause, 'Revisa tu conexión e inténtalo de nuevo.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js').catch(() => {});
    const poll = setInterval(() => { if (!document.hidden) void refresh(); }, 30_000);
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(poll); window.removeEventListener('focus', onFocus); };
  }, [refresh]);
  const command = useCallback(async (input: Command): Promise<AppResponse> => {
    const commandRevision = ++revision.current;
    try {
      const expectedChild = stateRef.current?.child?.id;
      const response = await fetch('/api/app', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(expectedChild ? { 'X-Cuentico-Child': expectedChild } : {}) }, body: JSON.stringify(input) });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.error || 'No pudimos guardar el cambio. Inténtalo de nuevo.');
      if (commandRevision === revision.current) setState(data.state);
      setError(null); return data;
    } catch (cause) { const message = readableError(cause, 'No pudimos guardar el cambio.'); setError(message); throw new Error(message); }
  }, []);
  return <Context.Provider value={{ state, loading, error, command, refresh, dismissError: () => setError(null) }}>
    <div className={`${state?.preferences.largeText ? 'large-text' : ''} ${state?.preferences.reducedMotion ? 'reduce-motion' : ''}`}>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => { setError(null); void refresh(); }}>Reintentar</button><button aria-label="Cerrar mensaje" onClick={() => setError(null)}>×</button></div>}
      {children}
    </div>
  </Context.Provider>;
}
export function useApp() { const context = useContext(Context); if (!context) throw new Error('AppProvider requerido'); return context; }
