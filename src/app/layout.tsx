import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/components/app-provider';
import './globals.css';
export const metadata: Metadata = { title: 'Cuentico · Historias para compartir', description: 'Una aventura de lectura para disfrutar en familia.', manifest: '/manifest.webmanifest', icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' }, appleWebApp: { capable: true, title: 'Cuentico', statusBarStyle: 'default' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#4CBCB4' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main-content">Saltar al contenido</a><AppProvider>{children}</AppProvider></body></html>; }
