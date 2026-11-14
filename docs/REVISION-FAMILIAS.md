# Ajustes tras revisión familiar

Rama rediseno-cuentico; main intacta. Recursos originales en Cambios/Cuentos.

## Correspondencia revisada visualmente
- Elian: párrafo 1 / 2 / 3 / 4–7 / 8 / 9–10. Escena 5 muestra alas brillantes y el MP4 suministrado.
- Nilo: 1 / 2 / 3 / 4 / 5 / 6–7. El párrafo 4 incluye arroyo, tortuga, lluvia y rana, presentes en la ilustración 4.
- Kiro: 1 / 2–4 / 5–6 / 7–8 / 9–10 / 11–14.
- Martina: 1 / 2 / 3–4 / 5–6 / 7–8 / 9–10.
Se conservaron íntegros todos los párrafos y seis escenas, IDs, favoritos y progreso.

## Multimedia
Animación original: Cambios/Cuentos/1 Las alas que brillaban con el sol/Animación de escena 5.mp4. Copia en public/assets/stories/alas/5.mp4. Sin audio propio para evitar superposiciones. Controles manuales y sin reproducción automática con reducción de movimiento.
Efectos originales sintetizados en WAV mediante scripts/generate-story-sounds.cjs: aves, pasos, agua, lluvia, rugido estilizado, destellos y cocina. Son aproximaciones sonoras, no grabaciones. Volumen moderado; tiempos configurables en content/scene-media.json, calculados a 140 palabras por minuto. No equivalen a sincronización palabra a palabra. Se cancelan al abandonar la página, al ocultarla o al silenciar. Al retroceder no se repiten efectos de páginas visitadas. El navegador requiere una interacción real para habilitar audio.

## Interfaz
Borde beige fino en botón de Inicio; etiqueta celeste; Perfil vuelve a navegación. Letra de 14 a 40 px en pasos de 1 px, predeterminada 20. Control parental y configuraciones se abren directamente sin reto adulto.

## Validacion final — 14 de noviembre de 2026
TypeScript aprobado; 35 pruebas unitarias y 16 pruebas Playwright aprobadas. La prueba nueva abre directamente metricas y configuracion, verifica 20/21/20 px, comprueba que el video de la escena cinco decodifica y que se solicita audio WAV despues de iniciar la lectura con interaccion real. El importador -Verify compara los 41 parrafos, 31 consejos y 24 ilustraciones originales. Compilacion de produccion aprobada. Catalogo SQLite local actualizado mediante upsert, sin reiniciar datos. No se modificaron esquemas de base de datos en esta revision.
La subida de la rama actualiza la solicitud existente. La publicacion de la vista previa depende de que Netlify termine su despliegue. No se fusiona con main ni se publica en produccion.
