# Publicar y guardar datos en Netlify

Cuentico usa **SQLite al ejecutarse localmente** y **PostgreSQL al compilarse para Netlify**. La web publicada necesita una base de datos externa para guardar perfiles, preferencias, favoritos y progreso. El archivo SQLite de la computadora no se convierte en almacenamiento permanente de Netlify.

El sitio comunicado por la usuaria es `https://cuentico.netlify.app/`. No se ha creado ninguna base remota ni activado recursos de pago desde este proyecto.

## Conectar una base de datos

Una opción para el MVP es [Neon Free](https://neon.com/pricing), que ofrece PostgreSQL con un plan gratuito sin tarjeta, sujeto a sus límites. También se puede usar otra base PostgreSQL compatible. La integración Neon de ChatGPT permite continuar la configuración cuando esté instalada y conectada; sugerirla no crea una cuenta ni una base.

Para la configuración manual:

1. Crea un proyecto PostgreSQL vacío llamado `Cuentico` en Neon.
2. En su panel, abre **Connect**, desactiva **Connection pooling** y copia la conexión directa de la base. Con una sola variable, esa conexión sirve para el primer despliegue y las consultas del MVP.
3. En Netlify, abre el proyecto Cuentico y entra en **Environment variables → Add a variable**.
4. Crea `DATABASE_URL` y pega allí la conexión PostgreSQL. Debe estar disponible para **Builds y Functions**, en el contexto de producción. Márcala como secreta si la interfaz ofrece esa opción.
5. Para usar pooling después, guarda la conexión directa en `DIRECT_DATABASE_URL` y cambia `DATABASE_URL` por la conexión con pooling de la misma base. Así las funciones usan el pool y las migraciones conservan la conexión directa. Si no se define la variable adicional, el despliegue utiliza `DATABASE_URL` en ambas fases.

Las direcciones de conexión contienen contraseñas: se introducen en Netlify, no en el chat, GitHub ni variables `NEXT_PUBLIC_*`. Los nombres y formatos están en `.env.netlify.example`; nunca reemplaces ese archivo versionado por credenciales reales.

## Subir el código y desplegar

1. En GitHub Desktop, revisa los archivos modificados, escribe `Habilitar guardado PostgreSQL` y pulsa **Commit to main → Push origin**.
2. En **Netlify → Deploys**, abre el despliegue que se inicie después del push. Si se subió antes de configurar las variables, vuelve a desplegar después de guardarlas.
3. El registro debe mostrar, en este orden: preparación del modelo PostgreSQL, generación de Prisma, migraciones, carga de cuentos y compilación de Cuentico.
4. Cuando aparezca **Published**, abre el sitio y crea un perfil de prueba, guarda un favorito, avanza en una lectura y recarga para comprobar que se conserva el progreso.

`netlify.toml` declara el comando `npm run build:netlify`, publicación `.next`, Node.js 22 y el adaptador Next.js. El build se detiene con un mensaje claro si `DATABASE_URL` falta, usa `file:` o no es PostgreSQL.

El primer despliegue de producción crea las tablas y carga los cuatro cuentos, sus escenas, consejos, personajes y actividades. El seed usa operaciones de actualización o inserción; no borra los perfiles ni el progreso al volver a publicar. No ejecutes `migrate reset` sobre la base publicada.

## Cómo se separan los dos proveedores

| Entorno | Esquema | Migraciones |
| --- | --- | --- |
| Local | `prisma/schema.prisma` | `prisma/migrations/` |
| Netlify | `prisma/postgresql/schema.prisma` | `prisma/postgresql/migrations/` |

Los modelos se editan en el esquema principal y `scripts/prepare-postgres.mjs` genera su equivalente PostgreSQL. SQLite y PostgreSQL mantienen historiales SQL separados. Los comandos de desarrollo y compilación local vuelven a generar el cliente SQLite; el build de Netlify genera el cliente PostgreSQL.

Los perfiles locales no se copian automáticamente a la nube. Cada navegador conserva su cookie familiar; borrar esa cookie elimina su acceso a los perfiles existentes hasta que haya un sistema de recuperación de cuentas.

## Vistas previas y migraciones

En producción se aplican migraciones y seed durante el build. Las vistas previas y despliegues de rama compilan sin modificar la base por defecto. Para probar cambios de esquema en una vista previa, configura su propia base aislada y activa `CUENTICO_INITIALIZE_DATABASE=true` sólo en ese contexto. Mantén las credenciales de producción fuera de vistas previas que no deban usarlas.

`npm run db:prepare:postgres` actualiza el esquema generado. `npm run db:generate:postgres` genera su cliente y `npm run db:migrate:postgres` aplica sus migraciones cuando las variables PostgreSQL están configuradas. Después de trabajar con ese cliente, `npm run setup` o `npm run dev` restaura el cliente SQLite para el entorno local.

## Diagnóstico del guardado

Una conexión ausente, una base inaccesible o tablas sin crear devuelve un error de guardado, sin aparentar que el cambio fue almacenado. Los registros de la aplicación no imprimen conexiones ni datos de la familia.

Un 404 se revisa en el registro del despliegue y la preparación del adaptador. Un error al guardar se revisa en la configuración de PostgreSQL y los registros de Functions. `Build status: Active` significa que las compilaciones están habilitadas, no que el último despliegue haya terminado correctamente. No añadas una redirección general a `/index.html` para una aplicación Next.js con rutas de servidor.

## Verificación realizada el 9 de noviembre de 2026

- La API publicada respondió `200` al estado anónimo y `400` a una solicitud inválida con el origen HTTPS correcto. Esa comprobación no creó ni cambió datos remotos.
- Pasaron **30 pruebas**, incluidas seis que ejecutan la migración real en PostgreSQL WASM con PGlite y comprueban claves foráneas, restricciones únicas y rollback.
- Pasó la compilación con el cliente PostgreSQL y la revisión estricta de TypeScript, usando una dirección de prueba y sin conectarse a una base remota.
- Pasaron de nuevo las **12 pruebas de API y navegador con SQLite**, incluyendo creación de perfil, guardado, recarga, actividades, favoritos y avatares. La base local de desarrollo no se utiliza para esas pruebas.
- La conexión a una base PostgreSQL de producción y el guardado real en Netlify **quedan pendientes de crear/configurar esa base y volver a desplegar**. Compilar o probar SQL en memoria no verifica la conexión real de Netlify.

Referencias: [Next.js en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Prisma 6 en Netlify](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-netlify), [historiales de migración por proveedor](https://www.prisma.io/docs/orm/v6/prisma-migrate/understanding-prisma-migrate/limitations-and-known-issues), [plan de Neon](https://neon.com/pricing).
