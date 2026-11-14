# Selección sonora de Elian

Un único efecto configurado por página. Conserva botones manuales, estados de reproducción reales, interrupción del anterior y limpieza al salir. No cambia diseño, navegación, texto ni ilustraciones. Sin música ni reproducción automática.

| Página | Selección | Estado |
|---|---|---|
|1|Risa humana natural (morgantj)|Activa; fragmento de 1.8 s, ganancia 0.8 respecto al volumen general de efectos|
|2|Suspiro humano natural|Pendiente; síntesis genérica retirada de la asignación|
|3|Una caída suave sobre hierba|Pendiente; pasos, tropiezo y caída sintetizados retirados de la asignación|
|4|Exclamación infantil natural (tgerginov)|Activa; fragmento de 1.8 s, ganancia 0.8|
|5|Destellos delicados|Activo; síntesis mágica específica existente, 1.8 s y ganancia 0.55|
|6|Carrera infantil sobre hierba|Pendiente; risa repetida y pasos genéricos retirados de la asignación|

La selección se basa en procedencia y construcción de los archivos: las grabaciones humanas no se presentan como un coro de varios niños. No se afirma una evaluación auditiva humana completa. Los WAV originales se conservan en Git y en disco; otros cuentos que los usan no cambian. Ningún archivo representa dos acciones distintas en Elian.

## Grabaciones necesarias
Entregar en WAV, MP3 u OGG con licencia de uso o grabadas con autorización:
- **elian-suspiro-natural.wav**: suspiro humano triste suave, 0.8–1.5 s, una respiración expresiva, sin palabras ni música dramática.
- **elian-caida-hierba.wav**: una sola caída ligera sobre hierba/tierra blanda, 0.5–1 s; textura física amortiguada, sin impactos violentos ni pasos/tropiezos añadidos.
- **elian-carrera-hierba.wav**: 1–2 s de pisadas rápidas ligeras sobre césped, con roce de hierba e irregularidad natural; sin risas ni música.

Los nombres anteriores son nombres solicitados para archivos futuros: **no existen todavía ni están declarados como rutas reproducibles**. Los tres espacios pendientes tienen asset:null y enabled:false; no se muestran botones sin audio ni se usan sustitutos. Actualmente las páginas 1, 4 y 5 tienen un botón; 2, 3 y 6 esperan grabación.

## Incorporación posterior
Copiar las grabaciones en public/assets/audio, anotar créditos, asignar asset real y enabled:true al único cue de la página en content/scene-media.json, y ejecutar npm run content:import y npm run db:seed. El importador rechaza más de un efecto por página para Elian. Mantener manual:true, anchor y label. No es necesario cambiar el reproductor ni el diseño.
