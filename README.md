# Cuentico

Aplicación local de lectura compartida para niños de 6 a 7 años y sus familias. Usa los cuatro cuentos, las 24 ilustraciones, los consejos, el logotipo y Poppins suministrados en este repositorio.

## Ejecutar localmente

Requisitos: Node.js 22 o posterior y npm. La primera instalación necesita acceso al registro de npm. Los recursos del contenido ya están importados; no se necesita Word.

```sh
npm install
```

Copia `.env.example` a `.env` si todavía no existe. Su configuración local es:

```dotenv
DATABASE_URL="file:./dev.db"
```

Inicializa la base de datos y arranca la aplicación:

```sh
npm run setup
npm run dev
```

Abre [http://127.0.0.1:3000](http://127.0.0.1:3000). La configuración inicial crea el perfil; no hay cuentas ni progreso de demostración precargado.

En desarrollo, espera el mensaje **Cuentico listo**. El lanzador compila las rutas secuencialmente para evitar una [condición de carrera de Next.js al escribir los manifiestos de desarrollo](https://github.com/vercel/next.js/issues/96259).

En PowerShell se pueden usar estos scripts, que también detectan la copia portátil de Node en `.tools/node-v24.22.1-win-x64` cuando existe:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1
```

Para demostrar la versión de producción y habilitar la instalación PWA, usa:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start.ps1
```

Este script compila e inicia Cuentico en el puerto 3000. El desarrollo guarda su caché en `.next-dev` y la compilación de producción en `.next`.

La base SQLite se guarda en `prisma/dev.db`, fuera del directorio público. Conserva este archivo para mantener el progreso. La cookie de este navegador identifica a la familia local; al borrar las cookies se pierde el acceso desde ese navegador a sus perfiles existentes. No hay recuperación de cuentas en esta versión.

## Abrir en el celular por Wi-Fi

1. Conecta la computadora y el celular a la misma red Wi-Fi.
2. Si Cuentico ya está ejecutándose, detén su terminal con **Ctrl + C**.
3. Desde la carpeta del proyecto, ejecuta:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start.ps1 -CompartirEnRed
```

4. Espera a que termine la compilación. Ejecuta `ipconfig` en otra terminal y busca la **dirección IPv4 del adaptador Wi-Fi**.
5. En el navegador del celular, abre `http://IP-DE-LA-COMPUTADORA:3000`; por ejemplo, `http://192.168.1.20:3000`.

Mantén la computadora encendida y la terminal abierta. Si Windows solicita acceso para Node.js, autoriza únicamente redes privadas. Las redes de invitados pueden impedir la conexión entre dispositivos.

La opción `-CompartirEnRed` habilita el acceso desde la red local durante esa ejecución. Sin esa opción, el script escucha en `127.0.0.1`. Cada navegador tiene su propia cookie familiar: al abrirlo por primera vez en el celular se configura un perfil y el progreso del navegador de la computadora no se transfiere automáticamente. El acceso por HTTP a una IP local permite usar la web; la instalación PWA y el service worker requieren HTTPS en el celular.

## Uso

El adulto configura un alias, edad, intereses y rutina. La navegación inferior permite abrir Inicio, Librería, Favoritos y Perfil. Cada cuento tiene detalle, consejo previo, seis escenas, guardado de progreso, actividad, personaje y valoración opcional.

La lectura y la actividad tienen estados independientes. Posponer la actividad conserva el personaje desbloqueado al terminar el cuento y permite volver a jugar desde Inicio. Los recordatorios se consultan dentro de la aplicación; no se envían cuando está cerrada. Se puede leer el siguiente cuento sin esperar al día de la rutina.

## Comandos

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en la interfaz local |
| `npm run build` | Compilación de producción |
| `npm start` | Servidor de producción después de compilar |
| `npm run typecheck` | Revisión estricta de TypeScript |
| `npm test` | Pruebas de dominio y contenido con Vitest |
| `npm run test:e2e` | Pruebas de API y navegador con Playwright |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:migrate` | Aplica las migraciones versionadas |
| `npm run db:seed` | Importa o actualiza el catálogo sin crear perfiles ficticios |
| `npm run content:import` | Vuelve a importar DOCX, imágenes y branding originales en Windows |

En Windows, las pruebas usan Chrome si está instalado en una ubicación habitual. En los demás casos usan el Chromium de Playwright, que se instala una vez:

```sh
npx playwright install chromium
npm run test:e2e
```

`CUENTICO_BROWSER` permite elegir un canal explícito, como `chrome` o `chromium`. En PowerShell, por ejemplo: `$env:CUENTICO_BROWSER = 'chromium'`.

Playwright compila la aplicación, inicia su propio servidor de producción en el puerto 3100 y utiliza una base SQLite nueva por ejecución. No modifica el progreso de `dev.db`. Las bases de prueba quedan excluidas de Git por `.gitignore`. Para comprobar el modo de desarrollo, ejecuta las pruebas con `CUENTICO_E2E_DEV=1`. El service worker PWA sólo se registra en producción.

Para ejecutar opcionalmente las pruebas contra el servidor de desarrollo, en PowerShell:

```powershell
$env:CUENTICO_E2E_DEV = '1'
npm run test:e2e
Remove-Item Env:CUENTICO_E2E_DEV
```

## Contenido y límites

Los cuentos disponibles son **Las alas que brillaban con el sol**, **Nilo, el gato explorador**, **Kiro y el corazón de la sabana** y **El misterio de las tortas desaparecidas**. El quinto registro está pendiente de contenido y no se puede leer. El nombre canónico Nilo procede del DOCX aunque su carpeta diga Milo.

No se suministraron archivos de audio ni retratos independientes de personajes. El lector funciona sin audio y la colección reutiliza recursos originales asociados a cada personaje. No se necesitan micrófono, cámara ni servicios de IA para las actividades.

El manifiesto PWA permite la instalación donde el navegador lo soporte. La aplicación necesita el servidor local y SQLite para consultar o guardar progreso: la instalación no equivale a funcionamiento completo sin conexión.

Este MVP está pensado para un ordenador y navegador de confianza. La entrada a ajustes distingue el rol adulto, pero no reemplaza una autenticación familiar de producción. No publiques este servidor directamente en Internet sin añadir controles de acceso, recuperación, despliegue HTTPS y revisión de privacidad.

No se afirma cumplimiento legal automático. Antes de una publicación comercial deben revisarse consentimiento y derechos de los responsables, retención y eliminación de datos, protección de menores, licencias del contenido, control de acceso y requisitos aplicables en cada país.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Modelo de datos](docs/DATA-MODEL.md)
- [Rutas y API](docs/ROUTES.md)
- [Importación de contenido](docs/CONTENT.md)
- [Funciones, pruebas y pendientes](docs/IMPLEMENTATION.md)
- [Configuración y diagnóstico de Netlify](docs/NETLIFY.md)

Referencias técnicas: [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation), [Prisma 6 y SQLite](https://www.prisma.io/docs/orm/v6/overview/databases/sqlite).

El script de migraciones configura `RUST_LOG=info` para evitar un [fallo de Prisma 6 al crear SQLite](https://github.com/prisma/orm/issues/29355). La migración SQL queda versionada y se aplica con `npm run db:migrate`.
