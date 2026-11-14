# Actualización del MVP Cuentico

Implementada en rediseno-cuentico, sin modificar main. Commits por fase y ajustes posteriores conservan puntos de recuperación.

## Componentes y comportamiento
- Logo contextual, botones y navegación con corazón y Explorar. Paleta extraída: #4CBCB4, #FEBD2D, #F36D43, #81BCD1 y #FBF1E5. Poppins local existente.
- Inicio conserva recomendación calculada y rutina. Librería vertical y buscador; Favoritos con portada y título.
- Perfil con rangos por IDs únicos, colección y pantallas separadas de configuración y control parental; configuración conserva formulario, perfiles y recordatorios existentes.
- ParentalView muestra sesiones, minutos activos y actividades reales, semana lunes-domingo y estado vacío.
- Preparación automática según palabras y primera ilustración lista; lector con puntos, tres tamaños, sonido activado en la sesión y salida confirmada. ActiveClock, guardado automático y sendBeacon conservados.
- Actividades con pasos compartidos visualmente, instrucciones y juego de secuencias accesible mediante arrastre o flechas. Comprobación separada de finalización. Recompensa y avatar conservan condiciones originales. La ruta antigua de valoración redirige sin borrar valoraciones históricas.
- SessionMetric añade registro persistente de consejos iniciales/voluntarios, actividad iniciada, tiempo activo, continuidad inmediata (sin aplazamiento y dentro de dos minutos) y actividad pospuesta. Migraciones aditivas SQLite/PostgreSQL.

## Recursos
Cuatro DOCX de Cuentos: 41 párrafos íntegros en seis páginas por cuento, IDs y personajes preservados. Cambios/05_Las alas que brillaban con el sol.png se utiliza en la escena 5 de alas. Cambios/Animación de cuento.mp4 se conserva, sin introducir reproducción no solicitada. Variantes Logo cuentico-03.png y Logo cuentico_Blanco.png copiadas a public/assets; solo se recortan márgenes transparentes de las copias. Originales intactos.

## Pruebas ejecutadas
- TypeScript: aprobado.
- Vitest: 31 pruebas aprobadas.
- Playwright completo: 14 pruebas aprobadas (API, recorrido móvil/escritorio, salida y reanudación, orden de escenas, avatar, favoritos, persistencia y métricas). Base SQLite aislada para cada ejecución.
- Importador -Verify: 41 párrafos, 31 consejos y 24 ilustraciones comprobados.
- Compilación de producción: aprobada; se repite al cierre por los ajustes finales.
- Migración aditiva y seed aplicados a la base SQLite local sin reinicio. No se aplicaron a producción.
- No hay script lint configurado. Capturas en artifacts/e2e-*.png. No se afirma que los 25 puntos del encargo tengan una prueba automatizada individual.

## Límites y recursos pendientes
No existen audios nuevos: se necesitan efectos breves correspondientes al bosque/viento, agua/lluvia, rugido y pasos; el lector sigue operativo sin archivos ficticios. El motor existente permite programarlos por página con delayMs y cancela eventos al salir. Las métricas nuevas solo existen desde esta versión. El tiempo histórico de sesiones se atribuye al día de finalización/inicio; no puede reconstruirse su distribución diaria exacta porque no hay intervalos históricos. No se ha desplegado ni fusionado con main.

## Archivos modificados respecto del respaldo inicial

```text
content/catalog.json
docs/REDISENO-MVP.md
prisma/migrations/20261114000000_session_metrics/migration.sql
prisma/postgresql/migrations/20261114000000_session_metrics/migration.sql
prisma/postgresql/schema.prisma
prisma/schema.prisma
public/assets/logo-horizontal.png
public/assets/logo-white.png
public/assets/stories/alas/5.png
scripts/import-content.ps1
src/app/configuraciones/page.tsx
src/app/control-parental/page.tsx
src/app/cuentos/[id]/valoracion/page.tsx
src/app/explorar/page.tsx
src/app/globals.css
src/app/layout.tsx
src/components/ui.tsx
src/core/contracts.ts
src/modules/activities/activity-view.tsx
src/modules/libraries/library-view.tsx
src/modules/profiles/collection-view.tsx
src/modules/profiles/parental-view.tsx
src/modules/profiles/profile-form.tsx
src/modules/profiles/profile-view.tsx
src/modules/profiles/ranks.ts
src/modules/profiles/settings-view.tsx
src/modules/reader/preparation-view.tsx
src/modules/reader/reader-view.tsx
src/modules/reading-sessions/dashboard.tsx
src/modules/rewards/completion-view.tsx
src/modules/stories/story-card.tsx
src/modules/stories/story-detail.tsx
src/server/application.ts
src/server/validation.ts
tests/e2e/browser.spec.ts
tests/e2e/metrics.spec.ts
tests/e2e/redesign.spec.ts
tests/unit/navigation.test.tsx
tests/unit/ranks.test.ts
tests/unit/validation.test.ts
```
