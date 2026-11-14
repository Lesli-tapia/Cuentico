# Bienvenida y logos

Se conservan originales; las variantes blanca y negra entregadas se respaldan antes de exportar. Encabezado: blanco actualizado; superficies claras: horizontal a color; bienvenida: Logo cuentico.png con simbolo encima y nombre debajo. Iconos PWA: simbolo oficial Logo cuentico-05.png. Las copias exportadas solo recortan margenes transparentes y ajustan resolucion.

WelcomeScreen se monta desde el layout: muestra solo el logo sobre beige, entra desde arriba con rebote suave y sale hacia arriba en 2.6 segundos. Cada carga completa del enlace muestra la bienvenida; la navegacion interna no la repite. Mientras tanto se prepara la ruta y el perfil existentes. No cambia la URL ni borra datos. Movimiento reducido usa desvanecimiento. Evento animationend y limite de seguridad evitan bloquear la aplicacion si falla la animacion o el archivo.
