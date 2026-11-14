# Efectos automáticos de lectura

No hay narración sincronizada: los tiempos son estimaciones configurables, no detección de palabras realmente leídas. Se conservan diseño y navegación.

## Configuración general
Editar content/reading-audio.json: wordsPerMinute (inicial 60, elección orientativa modificable), effectsVolume (0–0.35; volumen solo de efectos, no del video), minimumDelayMs, gapMs y maximumLatenessMs. Las velocidades se limitan a 20–300 para evitar configuraciones inválidas. El motor también expone setVolume() sin cambiar el volumen de otros reproductores. El botón de sonido existente silencia inmediatamente.

## Añadir un efecto a un cuento
1. Colocar el archivo con licencia en public/assets/audio y anotar autor, fuente, licencia y cambios en CREDITS.txt.
2. En content/scene-media.json, elegir la clave de cuento/página (alas-1, nilo-4, etc.). Agregar a sounds un objeto con asset, anchor (frase exacta del texto), wordOffset como respaldo, durationMs, clipStartMs opcional y volume opcional.
3. Ejecutar npm run content:import, npm run db:seed para SQLite local y las pruebas. Netlify actualiza el catálogo durante su build cuando la inicialización está habilitada en el contexto correspondiente. No se requiere cambiar el esquema ni borrar progreso.

Ejemplo de cue: {"asset":"/assets/audio/water.wav","anchor":"arroyo","wordOffset":14,"durationMs":2000,"clipStartMs":0,"volume":0.8}.

## Cálculo y ciclo de vida
Se cuentan palabras Unicode. El inicio del efecto se calcula con las palabras anteriores al anchor, divididas por wordsPerMinute. Si la frase no existe, se usa wordOffset, limitado al texto de la página. La duración estimada total proviene del número de palabras. Los efectos se ordenan y se separan por duración más gapMs. El tiempo de página empieza al entrar, no después de descargar los archivos.
La preparación precarga los audios; el reproductor decodifica antes del momento previsto. Un audio demasiado tardío se omite para no reproducirlo fuera de contexto. Cada entrada tiene una generación que invalida temporizadores y decodificaciones anteriores. Los snapshots y renderizados del componente no reinician la programación. Volver a una página crea una entrada nueva y permite oír de nuevo sus efectos una vez. Salir, ocultar la página, silenciar y desmontar cancelan todo. No se reproducen sonidos por tocar repetidamente una ilustración.

## Recursos naturales
Risa: morgantj, CC BY 3.0, grabación de un niño de cuatro años (no una multitud); crédito y licencia en public/assets/audio/CREDITS.txt. Asombro: tgerginov, CC0, reacciones infantiles naturales; se usa un fragmento sin alterar el tono. Son fuentes reales, no las vocalizaciones sintéticas anteriores. Los demás efectos disponibles mantienen síntesis suave; se pueden sustituir por grabaciones con licencia usando la misma configuración. El suspiro existente es sintetizado.

## Navegador
El audio se habilita con la interacción de inicio de lectura. Abrir directamente el lector puede requerir una interacción; no se fuerzan restricciones de autoplay del navegador.
