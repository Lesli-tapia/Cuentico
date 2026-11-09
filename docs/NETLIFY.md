# Diagnóstico y configuración de Netlify

El repositorio incluye `netlify.toml` con la raíz del proyecto, salida `.next`, Node.js 22, generación explícita de Prisma y el adaptador de Next.js de Netlify. El comando es `npm run build:netlify`. El generador de Prisma incluye el motor de Linux/OpenSSL que requiere el entorno de funciones de Netlify.

## Qué muestran las capturas del 404

`Build command: npm run build` y `Publish directory: .next` son valores correctos para Next.js. `Build status: Active` indica que las compilaciones están habilitadas, no que el último despliegue haya terminado correctamente. `Runtime: Not set` no demuestra por sí solo la causa del 404.

Hay que abrir **Deploys**, seleccionar el último despliegue y revisar:

1. Que use la rama `main` y el commit esperado de `Lesli-tapia/Cuentico`.
2. Que encuentre `package.json` en la raíz.
3. Que ejecute `prisma generate` antes de `next build`.
4. Que aparezca el adaptador de Next.js durante el build y se prepare la función que atiende las rutas.
5. Que el despliegue termine correctamente y esté publicado como despliegue de producción.

Después de subir estos cambios a GitHub, se puede iniciar un nuevo despliegue con caché limpia desde **Deploys → Trigger deploy → Clear cache and deploy site** (el nombre puede variar en la interfaz).

No añadas una redirección general a `/index.html`: las rutas de Next.js y `/api/app` necesitan el adaptador del servidor. Mantén la visibilidad del sitio que ya hayas elegido; hacer público el sitio no es una corrección del 404.

## Persistencia pendiente para alojamiento

El MVP actual sigue usando SQLite local (`prisma/dev.db`). Ese archivo y `.env` están excluidos de Git. Esta configuración prepara la compilación y el enrutamiento de Netlify, pero **no convierte SQLite en una base de datos persistente en sus funciones**.

Antes de considerar funcional el despliegue hospedado hay que conectar una base de datos compatible con Netlify y adaptar el proveedor, las migraciones y el seed. Cambiar solamente `DATABASE_URL` a una URL de PostgreSQL no es suficiente mientras el esquema siga declarando `provider = "sqlite"`. No se ha creado ningún servicio de base de datos ni activado recursos de pago.

Los errores de compilación, el 404 de rutas y los errores posteriores al guardar un perfil deben diagnosticarse con sus registros correspondientes. Un fallo de SQLite normalmente afecta al guardado o consulta de datos y no demuestra la causa del 404 inicial.

## Verificación

En esta sesión, `npm run build:netlify` terminó correctamente: generó el cliente Prisma con ambos motores, compiló Next.js y pasó la revisión estricta de TypeScript. El comando se ejecutó localmente; todavía no se ha comprobado un despliegue remoto con esta configuración.

La compilación local comprueba el código y los tipos. La corrección del 404 hospedado sólo puede confirmarse después de revisar el registro del despliegue de Netlify y abrir su URL. El archivo de configuración por sí solo no acredita un despliegue exitoso.

Referencias: [Next.js en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Build Plugins](https://docs.netlify.com/extend/install-and-use/build-plugins/), [Prisma 6 en Netlify](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-netlify).
