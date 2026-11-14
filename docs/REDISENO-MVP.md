# Rediseño del MVP: inspección

Base: commit 1dadc45, rama rediseno-cuentico. Main se conserva.

## Arquitectura y dependencias
Next.js 16 (App Router), React 19, TypeScript, Prisma 6, Tailwind 4, lucide-react. Datos persistidos mediante /api/app y src/server/application.ts. No sustituir por datos de demostración ni reiniciar la base.

## Archivos afectados
- Identidad y controles: src/components/ui.tsx, src/app/globals.css, public/assets.
- Inicio y librería: reading-sessions/dashboard.tsx, libraries/library-view.tsx, stories/story-card.tsx.
- Perfil: profiles/profile-view.tsx, profile-form.tsx y collection-view.tsx.
- Editorial: content/catalog.json, scripts/import-content.ps1, prisma/seed.ts.
- Lector: stories/story-detail.tsx, reader/preparation-view.tsx, reader-view.tsx, active-clock.ts y scene-events.ts.
- Actividades y recompensa: activities/activity-view.tsx, rewards/completion-view.tsx y ruta valoracion.
- Persistencia y métricas: core/contracts.ts, server/validation.ts, server/application.ts y esquemas SQLite/PostgreSQL.

## Recursos y limitaciones verificadas
Cambios contiene 05_Las alas que brillaban con el sol.png y Animación de cuento.mp4. Los cuatro DOCX actualizados están en Cuentos, mientras el importador actual lee Referencias/Cuentos. Revisar párrafos completos antes de sustituir y conservar IDs alas, nilo, kiro y tortas; los nombres editoriales pueden diferir de los IDs históricos.

Branding contiene paleta, Poppins y seis variantes PNG del logo. Los originales no se editarán. La interfaz actual carga /assets/logo.svg.

No hay audios nuevos en Cambios. No inventar archivos ni atribuir efectos al video sin revisión.

ReadingSession guarda timestamps, escena y duración activa. ActivityAttempt guarda intentos y fecha de finalización, pero AppState no expone esa fecha ni duración de actividades. No se puede reconstruir la duración histórica de actividades ni las aperturas de tips que nunca se registraron. Añadir registro futuro requiere una extensión segura de persistencia.

ActiveClock y autosave existentes deben conservarse; la finalización y desbloqueos actuales tienen comprobaciones de idempotencia en servidor. Rangos deben contar IDs únicos, sin contar relecturas.

## Validación prevista
Typecheck, Vitest, compilación y Playwright existentes; comprobar persistencia, lectura en segundo plano, actividad de secuencia y móviles. No hay script lint en package.json. Documentar cada comprobación efectivamente ejecutada.
## Editorial aplicada
Se importan íntegros 41 párrafos de los cuatro DOCX de Cuentos, sin reescritura. Se mantienen seis escenas e IDs históricos para compatibilidad. Ilustración 5 de alas actualizada desde Cambios; video conservado sin reproducción automática. Originales intactos.

## Registro futuro de métricas
Migración aditiva SessionMetric en SQLite y PostgreSQL: consejo inicial separado de aperturas voluntarias, comienzo y tiempo activo de actividades, y aplazamiento. Sin reconstruir eventos históricos ausentes. Las claves fijas hacen idempotentes los registros iniciales; las aperturas voluntarias usan UUID. Aplicar migraciones antes de utilizar el nuevo servidor.
