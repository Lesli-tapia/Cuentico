'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowRight, Bell, CalendarDays, Heart, VolumeX, Accessibility } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { Button } from '@/components/ui';
import type { ProfileInput } from '@/core/contracts';
import { profileSchema } from '@/server/validation';

type FormValues = z.infer<typeof profileSchema>;
const interests = [
  { value: 'aventuras', label: 'Aventuras' }, { value: 'fantasía', label: 'Fantasía' },
  { value: 'animales', label: 'Animales' }, { value: 'naturaleza', label: 'Naturaleza' }
] as const;
const weekdays = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 0, label: 'Domingo' }
];

export default function ProfileForm({ initial, mode = 'create', onSaved }: {
  initial?: ProfileInput; mode?: 'create' | 'update'; onSaved?: () => void;
}) {
  const { state, command } = useApp();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const plan = initial?.plan ?? state?.plan;
  const defaults: FormValues = {
    name: initial?.name ?? '', age: initial?.age === 9 ? 9 : initial?.age === 8 ? 8 : initial?.age === 7 ? 7 : 6,
    interests: interests.filter(item => initial?.interests.includes(item.value) ?? item.value === 'aventuras').map(item => item.value),
    plan: {
      minutes: plan?.minutes === 5 || plan?.minutes === 15 || plan?.minutes === 20 ? plan.minutes : 10,
      days: plan?.days.length ? plan.days : [1, 3, 5],
      moment: plan?.moment === 'mañana' || plan?.moment === 'mediodía' || plan?.moment === 'tarde' ? plan.moment : 'noche',
      time: plan?.time ?? '19:00', timezone: plan?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    preferences: initial?.preferences ?? state?.preferences ?? {
      pendingActivities: true, readingSessions: true, motivation: true,
      muted: true, reducedMotion: false, largeText: false
    }
  };
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(profileSchema), defaultValues: defaults
  });
  const selectedInterests = watch('interests');
  const selectedDays = watch('plan.days');

  async function save(values: FormValues) {
    setError(null);
    try {
      await command({ type: mode === 'create' ? 'createProfile' : 'updateProfile', input: values });
      onSaved?.();
      // A new profile changes the local family identity/cookie. Open a fresh
      // document so the router cannot reuse a page prefetched before that change.
      if (mode === 'create') window.location.assign('/');
      else router.push('/perfil');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar la configuración. Inténtalo de nuevo.');
    }
  }

  return <form className="stack profile-form" onSubmit={handleSubmit(save)} noValidate>
    <section className="card stack">
      <h2><Heart size={22} aria-hidden="true" /> Conozcamos a nuestro lector</h2>
      <div className="form-grid">
        <div className="field"><label htmlFor="child-name">Nombre o alias</label><input id="child-name" autoComplete="off" maxLength={30} {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : 'name-help'} /><small id="name-help">Un apodo también está bien. No necesitamos sus apellidos.</small>{errors.name && <p id="name-error" role="alert">{errors.name.message}</p>}</div>
        <div className="field"><label htmlFor="child-age">Edad</label><select id="child-age" {...register('age', { valueAsNumber: true })}><option value={6}>6 años</option><option value={7}>7 años</option><option value={8}>8 años</option><option value={9}>9 años</option></select>{errors.age && <p role="alert">Elige una edad de 6 a 9 años.</p>}</div>
      </div>
      <fieldset className="field"><legend>Intereses</legend><div className="check-group">{interests.map(item => <label key={item.value}><input type="checkbox" checked={selectedInterests.includes(item.value)} onChange={event => setValue('interests', event.target.checked ? [...selectedInterests, item.value] : selectedInterests.filter(value => value !== item.value), { shouldValidate: true })} />{item.label}</label>)}</div>{errors.interests && <p role="alert">Elige al menos un interés.</p>}</fieldset>
    </section>

    <section className="card stack">
      <h2><CalendarDays size={22} aria-hidden="true" /> Su momento para leer</h2>
      <div className="form-grid">
        <div className="field"><label htmlFor="reading-minutes">Tiempo para leer</label><select id="reading-minutes" {...register('plan.minutes', { valueAsNumber: true })}>{[5, 10, 15, 20].map(minutes => <option key={minutes} value={minutes}>{minutes} minutos</option>)}</select></div>
        <div className="field"><label htmlFor="reading-moment">Momento del día</label><select id="reading-moment" {...register('plan.moment')}><option value="mañana">Mañana</option><option value="mediodía">Mediodía</option><option value="tarde">Tarde</option><option value="noche">Noche</option></select></div>
      </div>
      <fieldset className="field"><legend>Días para leer</legend><div className="check-group">{weekdays.map(day => <label key={day.value}><input type="checkbox" checked={selectedDays.includes(day.value)} onChange={event => setValue('plan.days', event.target.checked ? [...selectedDays, day.value] : selectedDays.filter(value => value !== day.value), { shouldValidate: true })} />{day.label}</label>)}</div>{errors.plan?.days && <p role="alert">Elige al menos un día.</p>}</fieldset>
      <div className="form-grid">
        <div className="field"><label htmlFor="reminder-time">Hora del recordatorio</label><input id="reminder-time" type="time" {...register('plan.time')} aria-invalid={!!errors.plan?.time} />{errors.plan?.time && <p role="alert">Elige una hora válida.</p>}</div>
        <div className="field"><label htmlFor="reading-timezone">Zona horaria</label><input id="reading-timezone" list="timezones" {...register('plan.timezone')} aria-invalid={!!errors.plan?.timezone} aria-describedby="timezone-help" /><datalist id="timezones"><option value="America/Guayaquil" /><option value="America/Bogota" /><option value="America/Lima" /><option value="America/Mexico_City" /><option value="Europe/Madrid" /></datalist><small id="timezone-help">Por ejemplo: America/Guayaquil</small>{errors.plan?.timezone && <p role="alert">Revisa la zona horaria.</p>}</div>
      </div>
      <p className="muted">La rutina ayuda a elegir la próxima aventura. Pueden leer cualquier cuento cuando quieran.</p>
    </section>

    <section className="card stack">
      <h2><Bell size={22} aria-hidden="true" /> Recordatorios para la familia</h2>
      <p>Se muestran dentro de Cuentico cuando abren la aplicación.</p>
      <div className="check-group">
        <label><input type="checkbox" {...register('preferences.pendingActivities')} /> Actividades pendientes</label>
        <label><input type="checkbox" {...register('preferences.readingSessions')} /> Próximas lecturas</label>
        <label><input type="checkbox" {...register('preferences.motivation')} /> Mensajes para seguir leyendo</label>
      </div>
    </section>

    <section className="card stack">
      <h2><Accessibility size={22} aria-hidden="true" /> Una lectura a su manera</h2>
      <div className="check-group">
        <label><input type="checkbox" {...register('preferences.muted')} /><VolumeX size={18} aria-hidden="true" /> Silenciar sonido</label>
        <label><input type="checkbox" {...register('preferences.reducedMotion')} /> Reducir animaciones</label>
        <label><input type="checkbox" {...register('preferences.largeText')} /> Texto grande</label>
      </div>
    </section>

    {error && <p className="card" role="alert">{error}</p>}
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : mode === 'create' ? '¡Comenzar nuestra aventura!' : 'Guardar configuración'}<ArrowRight size={21} aria-hidden="true" /></Button>
  </form>;
}
