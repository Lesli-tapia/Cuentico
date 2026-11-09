// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AdultGate, BottomNav } from '../../src/components/ui';

vi.mock('next/navigation', () => ({ usePathname: () => '/libreria', useRouter: () => ({ replace: vi.fn() }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('navegación y área adulta', () => {
  it('identifica la sección actual con texto y semántica accesible', () => {
    render(<BottomNav />);
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
    expect(within(nav).getByRole('link', { name: 'Librería' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil');
  });
  it('mantiene los ajustes ocultos con una respuesta incorrecta y permite el acceso al resolver', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<AdultGate><button>Guardar rutina familiar</button></AdultGate>);
    expect(screen.queryByRole('button', { name: 'Guardar rutina familiar' })).not.toBeInTheDocument();
    const answer = screen.getByLabelText('Para continuar, ¿cuánto es 11 + 7?');
    fireEvent.change(answer, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar a la configuración' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa el resultado');
    expect(screen.queryByRole('button', { name: 'Guardar rutina familiar' })).not.toBeInTheDocument();
    fireEvent.change(answer, { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar a la configuración' }));
    expect(screen.getByRole('button', { name: 'Guardar rutina familiar' })).toBeVisible();
  });
});
