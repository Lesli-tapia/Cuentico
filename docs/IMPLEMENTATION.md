# Funciones y verificación

## Alcance del MVP

La implementación incluye perfiles locales, rutina editable, navegación, catálogo gratuito, favoritos, lector por escenas, persistencia SQLite, actividades, colección y recordatorios internos. El contenido procede de los originales del repositorio; el quinto cuento permanece pendiente.

Las actividades se configuran en el manifiesto: conversación familiar para `alas`, orden narrativo para `nilo` y `tortas`, y representación de personajes para `kiro`. Las actividades presenciales sólo requieren confirmación familiar; no recopilan grabaciones. El orden se valida en servidor y permite reintentos.

## Pruebas incluidas

| Suite | Verifica |
| --- | --- |
| Vitest: reloj activo | Acumulación monotónica, pausa, visibilidad, suspensión e inactividad |
| Vitest: actividades | Mezcla reproducible y validación de secuencias |
| Vitest: recordatorios | Días seleccionados y zonas horarias, incluido cambio de horario |
| Vitest: contenido | Cuatro cuentos disponibles, seis escenas, medios existentes y consejos |
| Playwright: API | Perfil, rutina, persistencia, pausa/reanudación, finalización idempotente, pendiente, actividad, avatar, favoritos, valoración y aislamiento |
| Playwright: navegador | Recorrido de lectura, pausa persistida, actividad pospuesta y ordenación accesible en viewport móvil |

## Resultados de la sesión de implementación

Comprobaciones ejecutadas el 8 de noviembre de 2026 en Windows con Node.js 24.22.1:

- `npm run typecheck`: correcto.
- `npm test`: 19 pruebas correctas.
- `npm run test:e2e`: 12 de 12 pruebas correctas sobre la compilación final de producción. Incluye posponer una actividad, retomarla desde Inicio y ordenar las ilustraciones con los controles accesibles.
- `npm run build`: correcto, ejecutado por la preparación de las pruebas E2E con la revisión estricta de TypeScript.
- Recorrido completo en desarrollo: correcto, con Turbopack, caché `.next-dev` separada y preparación secuencial de rutas. El alta del primer perfil abre un documento nuevo después de guardar la identidad familiar local.
- Scripts PowerShell de instalación, desarrollo, producción e importación: sintaxis verificada.
- Migración SQLite y seed: correctos. El script de migración fija `RUST_LOG=info` para evitar el fallo de Prisma 6 al crear el archivo SQLite en este entorno.

Las pruebas E2E usan una base SQLite aislada por ejecución y no modifican los perfiles ni el progreso de desarrollo. Se revisaron las capturas a 390 px en móvil y 1440 px en escritorio; no se detectó desbordamiento horizontal en los recorridos comprobados. Las capturas están en `artifacts/e2e-*.png`.

La preparación de Playwright compila e inicia producción por defecto. `CUENTICO_E2E_DEV=1` permite ejecutar la misma suite contra el servidor de desarrollo cuando se necesite comprobar ese modo.

## Adaptación del guardado a Netlify — 9 de noviembre de 2026

Se añadió un esquema PostgreSQL generado desde los mismos 19 modelos de SQLite, con migración independiente, generación del cliente adecuada al despliegue y un build que aplica migraciones y seed antes de compilar producción. La conexión se configura mediante `DATABASE_URL`; una conexión directa opcional se define en `DIRECT_DATABASE_URL`. Los clientes y migraciones de desarrollo siguen usando SQLite.

Pasaron 30 pruebas de dominio/configuración/migración y las 12 pruebas de API/navegador con SQLite. Se ejecutó la migración PostgreSQL en PGlite (PostgreSQL WASM), incluyendo claves foráneas, unicidad y rollback. También pasó la compilación PostgreSQL sin conectarse a una base remota. Esto no acredita el guardado en Netlify: falta crear/conectar una base real y desplegar el código con sus variables. Instrucciones en [NETLIFY.md](NETLIFY.md).

## Pendientes y límites deliberados

- Texto e ilustraciones del quinto cuento.
- Recursos de audio originales; la lectura funciona sin ellos.
- Retratos de personajes independientes; se reutilizan imágenes originales del cuento.
- Entrega push con la aplicación cerrada. Los avisos actuales son internos.
- Cuentas familiares autenticadas, recuperación de acceso y sincronización entre dispositivos.
- Bibliotecas adicionales, catálogo premium y compras. El modelo contempla el acceso, sin pasarela de pago.
- Lectura completa sin conexión. La PWA necesita el servidor para el progreso.
- Revisión editorial de la segmentación y revisión de accesibilidad con usuarios reales.
- Auditoría de seguridad y revisión legal antes de distribuir comercialmente.

La protección del área adulta en la interfaz no verifica identidad ni sustituye controles de autorización de producción. No se declara cumplimiento normativo automático.
