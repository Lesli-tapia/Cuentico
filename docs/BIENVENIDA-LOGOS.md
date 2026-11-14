# Bienvenida y logos

Se conservan originales; las variantes blanca y negra entregadas se respaldan antes de exportar. Encabezado: blanco actualizado; superficies claras: horizontal a color; bienvenida: Logo cuentico.png con simbolo encima y nombre debajo. Iconos PWA: simbolo oficial Logo cuentico-05.png. Las copias exportadas solo recortan margenes transparentes y ajustan resolucion.

WelcomeScreen se monta desde el layout: muestra solo el logo sobre beige, entra desde arriba con rebote suave y sale hacia arriba en 2.6 segundos. Cada carga completa del enlace muestra la bienvenida; la navegacion interna no la repite. Mientras tanto se prepara la ruta y el perfil existentes. No cambia la URL ni borra datos. Movimiento reducido usa desvanecimiento. Evento animationend y limite de seguridad evitan bloquear la aplicacion si falla la animacion o el archivo.

El perfil familiar se consulta durante la bienvenida, pero el lector y la preparacion se montan solo al cerrarla para evitar contabilizar lectura, iniciar consejos o reproducir sonidos debajo del logo.

## Validacion del 14 de noviembre de 2026
TypeScript y 49 pruebas unitarias aprobados. Suite completa de 20 pruebas Playwright sobre compilacion de produccion aprobada. Despues de aislar los temporizadores del lector de la bienvenida, se recompilo y se repitieron las 6 pruebas de bienvenida, lectura, video y navegacion: aprobadas. Captura central revisada en artifacts/welcome-mobile.png. Se verifica presentacion solo con logo, repeticion en recarga, ausencia al navegar internamente, movimiento reducido y enlaces directos. No hay cambios de base de datos ni se modifica main.
