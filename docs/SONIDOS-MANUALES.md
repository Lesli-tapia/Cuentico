# Sonidos manuales de Elian

Los nueve efectos de las seis páginas se activan exclusivamente con botones junto a anchor en content/scene-media.json. Cada cue tiene manual:true, label, anchor y un asset existente; se conservan clipStartMs, durationMs y volume. No se crean botones para frases sin configuración. Los otros cuentos mantienen su comportamiento.

El reproductor emite el estado al comenzar AudioBufferSourceNode y lo restablece mediante onended, al detenerlo o al cambiar de página. No se usan temporizadores visuales. Una nueva pulsación invalida descargas/decodificaciones previas y detiene el audio anterior. Se mantienen el silencio y el volumen independientes.

Todos los archivos necesarios existen: child-laugh-natural.mp3, sad-sigh.wav, steps.wav, stumble.wav, fall.wav, child-reactions-natural.mp3 y sparkle.wav. El suspiro, pasos y efectos físicos/mágicos son síntesis existente. Risas y asombro proceden de grabaciones con créditos en public/assets/audio/CREDITS.txt.

Para extenderlo: añadir manual:true, label y anchor literal a un sonido de otra página en content/scene-media.json y ejecutar npm run content:import. El motor excluye las señales manuales de la planificación automática.
