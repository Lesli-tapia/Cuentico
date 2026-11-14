> Selección vigente: ver [SELECCION-SONORA-ELIAN.md](SELECCION-SONORA-ELIAN.md). La configuración de nueve efectos descrita abajo corresponde a una versión anterior.

# Sonidos manuales de Elian

Los nueve efectos de las seis páginas se activan exclusivamente con botones junto a anchor en content/scene-media.json. Cada cue tiene manual:true, label, anchor y un asset existente; se conservan clipStartMs, durationMs y volume. No se crean botones para frases sin configuración. Los otros cuentos mantienen su comportamiento.

El reproductor emite el estado al comenzar AudioBufferSourceNode y lo restablece mediante onended, al detenerlo o al cambiar de página. No se usan temporizadores visuales. Una nueva pulsación invalida descargas/decodificaciones previas y detiene el audio anterior. Se mantienen el silencio y el volumen independientes.

Todos los archivos necesarios existen: child-laugh-natural.mp3, sad-sigh.wav, steps.wav, stumble.wav, fall.wav, child-reactions-natural.mp3 y sparkle.wav. El suspiro, pasos y efectos físicos/mágicos son síntesis existente. Risas y asombro proceden de grabaciones con créditos en public/assets/audio/CREDITS.txt.

Para extenderlo: añadir manual:true, label y anchor literal a un sonido de otra página en content/scene-media.json y ejecutar npm run content:import. El motor excluye las señales manuales de la planificación automática.

## Validacion del 14 de noviembre de 2026
TypeScript, 47 pruebas unitarias y 18 pruebas Playwright aprobadas. Compilacion de produccion aprobada. Tras ajustar el salto de linea para unir palabra y boton, se repitio la prueba manual sobre una compilacion nueva: aprobada. La prueba verifica ausencia de inicio automatico, tres botones de pagina 3, estados reales, interrupcion del anterior, repeticion y limpieza al cambiar de pagina. Las seis paginas tienen 1/1/3/1/1/2 botones, con anclajes y audios existentes. Catalogo local actualizado mediante upsert sin borrar progreso. Main sin cambios.
