# Contenido original

Los textos se importan de los cuatro DOCX de `Referencias/Cuentos/`. No se han generado relatos ni diálogos. La descripción de cada cuento es su primer párrafo original. Los títulos, párrafos, diálogos, moralejas y espacios internos se conservan en su orden original; solo se omiten los párrafos vacíos al final de los documentos.

| ID | Título canónico | Párrafos, sin título | Escenas | Actividad |
| --- | --- | ---: | ---: | --- |
| alas | Las alas que brillaban con el sol | 19 | 6 | Nuestro momento favorito |
| nilo | Nilo, el gato explorador | 22 | 6 | Ordena la aventura |
| kiro | Kiro y el corazón de la sabana | 24 | 6 | Adivina el personaje |
| tortas | El misterio de las tortas desaparecidas | 27 | 6 | Ordena la aventura |

La carpeta del segundo cuento menciona Milo, pero el DOCX utiliza Nilo: el nombre canónico es **Nilo**. El quinto espacio (`proximamente`) tiene `available: false`, sin texto, ilustraciones, personaje ni actividad, y se excluye del contenido disponible.

## Segmentación y recursos

Los índices de escena son cero a cinco; sus ID estables son `alas-1` a `alas-6`, y equivalentes para cada cuento. Cada escena agrupa párrafos completos: no se reescriben, dividen ni fusionan sus textos. El importador incluye límites explícitos basados en las ilustraciones originales y comprueba la reconstrucción completa de los 92 párrafos.

Las 24 ilustraciones se revisaron en una hoja de contacto y se copiaron sin modificación a `public/assets/stories/{id}/{1..6}.png`. Las imágenes 5 y 6 de Nilo proceden de los archivos originales con nombres largos terminados en `-5.png` y `-6.png`, respectivamente: el búho y la colina, y el reencuentro con Tomás.

Los personajes se identifican como Elian, Nilo, Kiro y Martina. Como no hay retratos independientes, la colección utiliza ilustraciones originales relacionadas con cada personaje; cualquier encuadre visual pertenece a la interfaz, sin modificar el archivo original.

El logo oficial se copia a `public/assets/logo.svg`. La fuente Poppins y su licencia OFL proceden de `Branding/poppins/`. No se descargan tipografías externas.

`content/tips.json` conserva literalmente los 18 consejos de «ANTES DE LEER» y los 13 de «DURANTE LA LECTURA». No hay archivos de audio suministrados: los manifiestos contienen animaciones de imagen, sin rutas a audio inexistente. Las duraciones aproximadas son metadatos de presentación; el tiempo de lectura funcional se registra separadamente en cada sesión.

## Reimportar y verificar

Desde la raíz del proyecto, en Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/import-content.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/import-content.ps1 -Verify
```

La primera orden reconstruye los manifiestos y copia los recursos originales. La segunda verifica el texto contra los DOCX, los consejos y las huellas de las 24 imágenes sin escribir archivos. Se requiere Windows PowerShell con `System.IO.Compression.FileSystem`; no requiere Word, Python ni servicios externos.

Para incorporar contenido nuevo, añada su definición al importador y sus recursos originales, o produzca un manifiesto compatible con los contratos de `src/modules/content/types.ts`. La UI consume el catálogo y no necesita componentes específicos para cada cuento.
