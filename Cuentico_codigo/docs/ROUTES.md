# Rutas y API

| Ruta | Experiencia |
| --- | --- |
| `/` | Saludo, recomendación según progreso, pendientes y colección |
| `/onboarding` | Creación del perfil infantil y rutina por el adulto |
| `/libreria` | Catálogo gratuito y estado de cada cuento |
| `/favoritos` | Cuentos guardados por el perfil activo |
| `/perfil` | Estadísticas, perfiles y ajustes familiares |
| `/coleccion` | Personajes bloqueados/desbloqueados y selección de avatar |
| `/cuentos/[id]` | Portada, sinopsis, duración estimada y favoritos |
| `/cuentos/[id]/preparacion` | Consejo original previo a la lectura |
| `/cuentos/[id]/lectura` | Escenas, texto completo, consejos, pausa y guardado |
| `/cuentos/[id]/fin` | Tiempo real y acceso o aplazamiento de la actividad |
| `/cuentos/[id]/actividad` | Actividad asignada a la sesión |
| `/cuentos/[id]/recompensa` | Personaje desbloqueado al completar la lectura |
| `/cuentos/[id]/valoracion` | Valoración opcional del cuento |

Los IDs iniciales son `alas`, `nilo`, `kiro` y `tortas`. `proximamente` reserva contenido futuro y no admite sesiones.

## Endpoint de aplicación

`GET /api/app` devuelve `{ state }`. Antes del onboarding devuelve un estado anónimo vacío.

`POST /api/app` recibe un comando validado y devuelve `{ state, result? }`. Los tipos completos están en `src/core/contracts.ts`. Los errores devuelven `{ error }` con un estado HTTP de error.

| Comando | Datos principales |
| --- | --- |
| `createProfile` / `updateProfile` | `input`: alias, edad, intereses, rutina y preferencias |
| `switchProfile` | `childId` de la misma familia |
| `startReading` | `storyId`, `reread?`; devuelve `result.sessionId` |
| `saveReading` | `sessionId`, `sceneIndex`, total absoluto `activeDurationSeconds`, `pause?` |
| `finishReading` | `sessionId`, total absoluto de segundos |
| `deferActivity` | `sessionId` |
| `completeActivity` | `sessionId`, `order?` de IDs de escenas |
| `toggleFavorite` | `storyId` |
| `selectAvatar` | `characterId` desbloqueado |
| `rateStory` | `storyId`, `rating` |
| `updatePreferences` | Objeto `preferences` completo |
| `readReminder` | `reminderId` |

El navegador envía la cookie familiar automáticamente al mismo origen. Las APIs no aceptan que el cliente elija un ID familiar arbitrario. La primera creación de perfil establece la cookie. No se implementa acceso remoto a cuentas en esta versión.
