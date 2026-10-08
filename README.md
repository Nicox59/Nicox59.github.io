# NIAR — Portafolio de Nicolás Araya

Sitio estático preparado para GitHub Pages. Incluye biografía, proyectos, trayectoria y contacto. No necesita servidor Python ni dependencias para publicarse.

## Dedos Interactivos

La experiencia está en [niar.cl/dedos-interactivos/](https://niar.cl/dedos-interactivos/), con acceso desde el inicio, el menú Laboratorio y la ficha del proyecto. Incluye Hilos, Solar, Planeta, Agujero negro y filtros por gestos. Es una adaptación para navegador del proyecto local Dedos Interactivos; la aplicación de escritorio se conserva por separado.

Al elegir un modo, la guía muestra cuántas manos necesita y cómo operarlo. Filtros incluye dibujos de las dos poses: pulgar e índice abiertos para blanco y negro; pulgar, índice y medio abiertos para pixelado a color. Ambas manos deben hacer la misma pose. La página también explica los controles y ofrece ayuda si el efecto no aparece.

La cámara solo se solicita al pulsar **Activar cámara**. **Apagar cámara** detiene sus pistas y el detector; salir de la página también los detiene. No se solicita micrófono, no se graba video ni se envían imágenes. El modelo y los recursos de MediaPipe se sirven desde este mismo sitio y se cargan al activar la experiencia. Se necesita cámara, HTTPS (o localhost para desarrollo) y WebGL2. El rendimiento depende del dispositivo; aún requiere comprobación en teléfonos físicos.

Para editarla, trabajar en `tools/dedos-web/`. Con Node.js 22.12 o superior, ejecutar:

```powershell
cd tools/dedos-web
npm ci
npm test
npm run build
```

El resultado se guarda en `dedos-interactivos/` y debe publicarse junto al portafolio. El generador Python no recompila esta experiencia. El script de preparación copia los recursos WASM de MediaPipe 0.10.35 y reutiliza el modelo publicado; si falta, descarga el modelo oficial. `node_modules/` y `public/` de la fuente están excluidos de Git. Los archivos publicados incluyen la licencia Apache 2.0 de MediaPipe. Referencia: [Hand Landmarker para web](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js).

Las seis pruebas automatizadas cubren permisos pendientes, apagado durante la apertura, cambio de cámara fallido, fallo de reproducción y cierre de la cámara anterior al cambiar correctamente. El 6 de octubre de 2026 se comprobó en Chrome, desde niar.cl, la detección de una y dos manos con la cámara HP Wide Vision HD, los controles de los cinco modos y el apagado. Sigue pendiente probar los gestos específicos de los filtros, teléfonos físicos y el cambio entre varias cámaras físicas.

## Editar contenido

Todas las páginas comparten el tema oscuro de NIAR: fondo azul muy oscuro, texto claro, acentos cian y botones azules. La paleta general está en assets/site.css; el inicio añade el recorrido con assets/travelling.css, y Laboratorio conserva su distribución de controles usando la misma paleta y las tipografías DM Sans y Manrope en tools/dedos-web/src/style.css. Los bloques de contacto heredan el texto claro del tema. El generador versiona el CSS compartido para cargar las actualizaciones después de publicarlas.

Se revisaron las vistas de escritorio, móvil de 320 × 568 y 390 × 844 y la orientación horizontal del recorrido; el menú móvil, el final de la espada y el contraste del contacto se comprobaron en el navegador. Estas comprobaciones usan tamaños de ventana, sin sustituir una prueba de rendimiento en un teléfono físico.

El inicio incluye un recorrido 3D por la espada de nueve runas: el desplazamiento acerca la cámara a cada tecnología y al final vuelve a mostrar la espada completa. La franja de iconos y circuitos se toma directamente de la imagen original y se aplica al material de la superficie real del modelo, sin una placa rectangular flotante. Se usa la región de mayor resolución que corresponde al recorte aportado por el usuario; el recorte se conserva en `assets/sword/inlay-reference.png`. Los SVG de las tarjetas de texto se mantienen por separado. El fondo oscuro se estrecha y se funde con el contorno junto a la empuñadura y la punta, conservando los detalles laterales originales. La posición de cada runa se comparte con el recorrido de cámara. La vista inicial muestra las nueve runas. Al entrar al capítulo 01 se ocultan las siguientes; cada nuevo capítulo revela su icono y conserva los anteriores, con una transición suave que también se invierte al subir. Al enfocar una tecnología, solo aumenta la emisión de los píxeles azules luminosos de su icono, dentro de una máscara individual. El brillo de los circuitos dorados y los costados permanece constante. El aura azul se anima con shaders y partículas. Los enlaces, textos y navegación siguen disponibles en la vista ligera, cuando WebGL falla y con la preferencia de movimiento reducido. Los botones permiten pausar el aura, cambiar a la vista ligera o saltar el recorrido. La animación se detiene fuera del recorrido o al ocultar la pestaña. La capa fija queda limitada al recorrido y no cubre las secciones siguientes. La cámara sigue las posiciones reales de los capítulos cuando el texto ocupa más altura. En móviles verticales la espada completa se encuadra en el espacio disponible sobre el texto; en horizontal se mantienen dos columnas.

Contenido y símbolos: `tools/sword_content.py`. Diseño del inicio: `assets/travelling.css`. Escena 3D: `tools/sword-web/src/main.js`. Para regenerar:

```powershell
cd tools/sword-web
npm ci
npm run build
cd ../..
python tools/build.py
```

El modelo original en `Downloads/Espada travelling` se conserva. La copia web en `assets/sword/sword.glb` ocupa 4.866.912 bytes y tiene 94.090 triángulos; las texturas WebP miden 1536 × 1536. El informe está en `assets/sword/optimization.json`. Para volver a optimizar el original, ejecutar desde `tools/sword-web`: `npm run optimize -- "RUTA_DEL_ORIGINAL.glb"`. Este comando también copia la imagen de referencia desde la misma carpeta.

El generador añade versiones basadas en el contenido a las URLs del CSS y JavaScript del recorrido para cargar las correcciones después de publicarlas. Compilar primero el bundle y luego regenerar las páginas.

Durante la carga del modelo se muestra un círculo cian con el texto «Cargando
experiencia 3D…». La espada PNG permanece oculta y el indicador desaparece después
del primer fotograma renderizado. La imagen se conserva para la vista ligera,
el movimiento reducido y los errores de WebGL. Se verificaron una carga lenta y
un fallo del modelo con un servidor local de prueba, además de la vista móvil.

Three.js se incluye en el bundle local, sin CDN. Su licencia MIT se conserva en `assets/travelling/THREE-LICENSE.txt`. Revisar el recorrido en escritorio y móvil después de cambiar el modelo o las posiciones de las runas; el rendimiento en teléfonos físicos depende del equipo y aún requiere una prueba real.

Editar `tools/build.py` y ejecutar `python tools/build.py`. El generador actualiza `index.html`, `proyectos/index.html`, `cv/index.html`, `contacto/index.html` y `404.html`. Los archivos HTML generados deben incluirse al publicar cambios.

El diseño está en `assets/site.css`; el menú móvil y la impresión del CV están en `assets/site.js`. Las ilustraciones SVG son decorativas y no representan capturas de las aplicaciones.

## Vista previa

Desde esta carpeta, ejecutar `python -m http.server 8765 --bind 127.0.0.1` y abrir `http://127.0.0.1:8765`.

## GitHub Pages

Repositorio público: [Nicox59/Nicox59.github.io](https://github.com/Nicox59/Nicox59.github.io). GitHub Pages está habilitado desde la rama `main`, carpeta `/ (root)`. Sitio publicado: [niar.cl](https://niar.cl/), con HTTPS obligatorio. `www.niar.cl` y `nicox59.github.io` redirigen al dominio principal. `.nojekyll` permite servir los archivos tal como están.

El dominio personalizado `niar.cl` está asociado al repositorio y su propiedad está verificada en la cuenta de GitHub. La zona DNS se administra desde “Gestionar DNS” en el portal de INC mediante Openprovider. El certificado TLS cubre `niar.cl` y `www.niar.cl`; ambas direcciones se comprobaron con validación normal del certificado y respuesta HTTP 200 el 1 de octubre de 2026.

## Dominio niar.cl

Agregar primero `niar.cl` en Settings → Pages → Custom domain. Si se publica desde una rama, GitHub genera un archivo `CNAME`; sincronizar ese cambio en el checkout local.

En el administrador de zona DNS de INC, configurar estos registros. Para el dominio raíz, dejar Host Name vacío: este editor no admite `@` y añade `.niar.cl` a cualquier nombre ingresado.

| Nombre | Tipo | Destino |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `nicox59.github.io` |

Reemplazar solamente los registros web incompatibles del dominio raíz y `www`, conservando los registros de correo y otros servicios. El editor habilitado requiere `ns1.openprovider.nl`, `ns2.openprovider.be` y `ns3.openprovider.eu`, que ya se guardaron como nameservers del dominio. Las direcciones IP de GitHub Pages no son nameservers.

El TXT `_github-pages-challenge-Nicox59.niar.cl` permite verificar la propiedad desde la configuración Pages de la cuenta GitHub. Conservarlo tras verificar. En el editor de INC el tipo TXT aparece como “SPF (txt)”. No es necesario contratar alojamiento web para GitHub Pages.

Enforce HTTPS está activado. Si se modifican los DNS en el futuro, los cambios pueden tardar hasta 24 horas.

Fuentes: [dominio personalizado](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [publicación desde una rama](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) y [nameservers de Openprovider](https://support.openprovider.eu/hc/en-us/articles/360026557334-How-to-change-nameservers-of-a-domain).

## Datos personales

El contenido profesional se adaptó del currículum aportado por el propietario. No se publica el teléfono, la comuna ni el documento Word original. El correo de contacto fue aprobado por el propietario para su publicación pública.


## Contenido profesional y descarga del CV

Las fichas de proyectos muestran propósito, aporte personal, estado, alcance y
evidencia. Sus textos están en `tools/project_details.py`; no se publican enlaces
a repositorios privados ni se afirma que un prototipo esté en producción.
Los proyectos Unity se presentan por separado: OdontologiaRA para exploración
anatómica y odontológica, y Mapa 3D para manipulación del terreno USS. El nombre
OdontologiaRA sustituye a PatientAR en el portafolio y en el CV, conservando
`#patientar` como ancla compatible con los enlaces anteriores. Las carpetas y el
código de los proyectos Unity conservan sus nombres originales.
Las capturas reales de RoomMapper y del laboratorio web están en `assets/projects/`.
NFC y MCP usan portadas conceptuales generadas con imagegen, identificadas como
ilustraciones de IA. Los prompts y los archivos finales se documentan en
`tools/project_image_prompts.md`. NFC incluye además una vista ampliable del menú,
recreada a partir del diseño Android del prototipo con campos vacíos; el aviso
indica que no es una captura de un dispositivo. El diseño de esa vista está en
`tools/nfc_menu_preview.html`.
El favicon celeste incluye una versión en su URL para renovar las copias que
el navegador conserve del icono anterior.
También se incluyen seis fotografías originales de biomodelos, sin modificar,
con vista previa en Inicio y una galería ampliable en Proyectos. La selección y
los pies de fotografía se mantienen en `tools/project_evidence.py`.
El panel UNLi usa su interfaz real con datos ficticios de demostración y un aviso
visible; no contiene nombres, RUT, correos ni registros reales de estudiantes.
La captura DJI muestra el panel sin conexión a un dron y la del juego corresponde
a una vista de desarrollo. Estas imágenes documentan interfaces y piezas físicas;
no se presentan como validaciones clínicas ni resultados de vuelos.
El relato distingue visión artificial de las integraciones MCP y conserva los
límites de observación pasiva de DJI, reconstrucción posterior de RoomMapper e
integridad técnica de NFC.

El CV preparado está en `output/pdf/CV-Nicolas-Araya.pdf`, con dos páginas A4,
fuentes incorporadas y enlaces de contacto. Para regenerarlo, ejecutar
`python tools/build_cv_pdf.py` con ReportLab disponible y después
`python tools/build.py`. El PDF se revisó renderizando sus dos páginas. Trayectoria
conserva además el botón de impresión y reglas específicas para papel.

Los datos de formación sin respaldo adicional conservan su precisión anterior:
la práctica DXC sigue indicando 2025; no se añade una escala a 9,20 ni instituciones
o fechas no confirmadas para los cursos de redes y Linux.

Los controles del recorrido incluyen etiquetas en foco de teclado y al pasar el
cursor, y el enlace para saltarlo tiene mayor contraste. Contacto permite copiar
el correo con confirmación accesible y selección manual si el navegador impide
la copia. En el laboratorio, «Unir ambas manos» se muestra solo en Hilos.
