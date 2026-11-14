'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Home, Heart, Compass, Star, UserRound, Lightbulb, X } from 'lucide-react';
import { useApp } from './app-provider';
import catalog from '../../content/catalog.json';
export function Logo({ white = false }: { white?: boolean }) { return <Link href="/" aria-label="Cuentico, inicio" className="logo"><img src={white ? "/assets/logo-white.png" : "/assets/logo-horizontal.png"} alt="Cuentico" width="210" height="52" /></Link>; }
export function Avatar() {
  const { state } = useApp();
  const character = catalog.stories.find(s => s.character?.id === state?.child?.avatarCharacterId)?.character;
  return <span className="avatar">{character ? <img src={character.image} alt={character.name} /> : <UserRound aria-hidden="true" />}</span>;
}
export function Header({ back }: { back?: string }) { return <header className="app-header">{back && <Link href={back} className="icon-button" aria-label="Volver"><ArrowLeft /></Link>}<Logo white={usePathname() === "/libreria"} /><Link href="/perfil" aria-label="Ir al perfil"><Avatar /></Link></header>; }
export function BottomNav() {
  const currentPath = usePathname(); const path = currentPath === '/coleccion' ? '/perfil' : currentPath;
  return <nav className="bottom-nav" aria-label="Navegación principal">{[
    { href: '/', label: 'Inicio', Icon: Home }, { href: '/libreria', label: 'Librería', Icon: BookOpen },
    { href: '/favoritos', label: 'Favoritos', Icon: Heart }, { href: '/explorar', label: 'Explorar', Icon: Compass }
  ].map(({ href, label, Icon }) => <Link key={href} href={href} className={path === href ? 'active' : ''} aria-current={path === href ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>)}</nav>;
}
export function Shell({ children, back, immersive = false }: { children: ReactNode; back?: string; immersive?: boolean }) {
  return <div className={`app-shell ${immersive ? 'immersive' : ''}`}><Header back={back} /><main id="main-content">{children}</main>{!immersive && <BottomNav />}</div>;
}
export function RequireProfile({ children }: { children: ReactNode }) {
  const { state, loading, error, refresh } = useApp(); const router = useRouter();
  useEffect(() => { if (!loading && state && !state.child) router.replace('/onboarding'); }, [loading, state, router]);
  if (loading || !state?.child) return <div className="loading-screen"><Logo /><p role="status">{error ? 'Necesitamos conectar con tu biblioteca.' : 'Abriendo nuestra biblioteca…'}</p>{error && <button className="button" onClick={() => void refresh()}>Reintentar</button>}</div>;
  return <>{children}</>;
}
export function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={`button ${className}`} {...props}>{children}</button>; }
export function ActionLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) { return <Link className={`button ${secondary ? 'secondary' : ''}`} href={href}>{children}</Link>; }
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) { return <div className="page-title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>; }
export function ProgressBar({ value, label }: { value: number; label: string }) { return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
export function TipCard({ text, during = false }: { text: string; during?: boolean }) { return <aside className="tip-card"><span className="eyebrow"><Lightbulb size={22} aria-hidden="true" /> Consejo para familias</span><h2>{during ? 'Leamos juntos' : 'Antes de la aventura'}</h2><p>{text}</p></aside>; }
export function EmptyState({ title, children }: { title: string; children: ReactNode }) { return <div className="empty-state"><Star aria-hidden="true" /><h2>{title}</h2><p>{children}</p><ActionLink href="/libreria">Explorar cuentos <ArrowRight size={20} /></ActionLink></div>; }
export function AdultGate({ children, title = 'Configuración para adultos' }: { children: ReactNode; title?: string }) {
  const [unlocked, setUnlocked] = useState(false); const [answer, setAnswer] = useState(''); const [invalid, setInvalid] = useState(false);
  const [challenge] = useState(() => ({ a: 11 + Math.floor(Math.random() * 8), b: 7 + Math.floor(Math.random() * 8) }));
  if (unlocked) return <>{children}</>;
  return <section className="card adult-gate"><h2>{title}</h2><p>Este espacio es para la persona adulta que acompaña la lectura.</p><form onSubmit={e => { e.preventDefault(); if (Number(answer) === challenge.a + challenge.b) setUnlocked(true); else setInvalid(true); }}><label htmlFor="adult-answer">Para continuar, ¿cuánto es {challenge.a} + {challenge.b}?</label><input id="adult-answer" inputMode="numeric" autoComplete="off" value={answer} onChange={e => setAnswer(e.target.value)} required />{invalid && <p role="alert">Revisa el resultado e inténtalo de nuevo.</p>}<Button type="submit">Entrar a la configuración</Button></form></section>;
}
export function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const dialog = document.querySelector<HTMLDialogElement>('dialog'); dialog?.showModal(); return () => { dialog?.close(); previous?.focus(); }; }, []);
  return <dialog className="dialog" aria-label={title} onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }}><button className="icon-button dialog-close" aria-label="Cerrar" onClick={close}><X /></button><h2>{title}</h2>{children}</dialog>;
}
export function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)} min ${Math.floor(seconds % 60)} s`; }
