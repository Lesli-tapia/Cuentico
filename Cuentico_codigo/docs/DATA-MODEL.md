# Modelo de datos

El archivo autoritativo es `prisma/schema.prisma`. El seed importa el catálogo sin crear familias de demostración.

| Entidad | Propósito y relaciones |
| --- | --- |
| Universe | Agrupa bibliotecas de un mismo universo |
| Library | Biblioteca ordenada de cuentos con estado de acceso |
| Story | Metadatos, disponibilidad, orden, portada y relación con biblioteca |
| StoryScene | Escena ordenada, párrafos originales y eventos declarativos |
| StoryMedia | Medios asociados al cuento o a sus escenas |
| FamilyProfile | Identidad familiar local y selección de perfil activo |
| ChildProfile | Alias, edad, intereses y avatar; pertenece a una familia |
| ReadingPlan | Rutina de minutos, días, momento, hora y zona horaria |
| ReadingSession | Sesión, escena actual, timestamps y duración activa |
| StoryProgress | Progreso y valoración de un cuento por perfil |
| Activity | Una actividad declarada para cada cuento disponible |
| ActivityAttempt | Actividad asignada a una sesión y sus intentos |
| Character | Personaje asociado a un cuento y su imagen original |
| CharacterUnlock | Fecha de desbloqueo de un personaje por perfil |
| Favorite | Relación única entre cuento y perfil |
| Reminder | Aviso, categoría, vencimiento, lectura y clave de deduplicación |
| NotificationPreference | Preferencias de recordatorios, sonido y accesibilidad |
| LibraryEntitlement | Acceso de la familia a una biblioteca |

## Estados

El contrato HTTP representa sesiones como `Active`, `Paused` o `Completed`. El progreso de cuento es `InProgress` o `Completed`; la ausencia de registro significa «Por leer». La actividad es `Pending` o `Completed`, con independencia del progreso de lectura. La valoración admite `LOVE`, `LIKE` y `NOT_FAVORITE`, y puede omitirse.

Los días de la rutina usan la convención JavaScript: domingo `0`, lunes `1`, hasta sábado `6`. Las horas son `HH:mm`; la zona es un nombre IANA, por ejemplo `America/Guayaquil`. Los timestamps HTTP se serializan en ISO 8601.

## Reglas de integridad

- Un registro de progreso y un favorito por combinación perfil/cuento.
- Un desbloqueo por combinación perfil/personaje.
- Una actividad asignada por sesión, con reintentos sobre el mismo registro.
- No se permite seleccionar un avatar bloqueado ni comenzar un cuento sin contenido.
- La finalización y el tiempo acumulado son idempotentes ante reenvíos.
- Las operaciones sobre sesiones y perfiles comprueban pertenencia a la familia local.

La migración inicial crea las tablas y restricciones. `npm run db:migrate` aplica migraciones pendientes; `npm run db:seed` puede repetirse para actualizar el catálogo sin borrar el progreso familiar. No uses `prisma migrate reset` sobre una base que quieras conservar.
