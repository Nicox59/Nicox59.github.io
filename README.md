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

El inicio incluye un recorrido 3D por la espada de nueve runas: el desplazamiento acerca la cámara a cada tecnología y al final vuelve a mostrar la espada completa. La franja de iconos y circuitos se toma directamente de la imagen original y se aplica al material de la superficie real del modelo, sin una placa rectangular flotante. Se usa la región de mayor resolución que corresponde al recorte aportado por el usuario; el recorte se conserva en `assets/sword/inlay-reference.png`. Los SVG de las tarjetas de texto se mantienen por separado. El fondo oscuro se estrecha y se funde con el contorno junto a la empuñadura y la punta, conservando los detalles laterales originales. La posición de cada runa se comparte con el recorrido de cámara. La vista inicial muestra las nueve runas. Al entrar al capítulo 01 se ocultan las siguientes; cada nuevo capítulo revela su icono y conserva los anteriores, con una transición suave que también se invierte al subir. Al enfocar una tecnología, solo aumenta la emisión de los píxeles azules luminosos de su icono, dentro de una máscara individual. El brillo de los circuitos dorados y los costados permanece constante. El aura azul se anima con shaders y partículas. Los enlaces, textos y navegación siguen disponibles en la vista ligera, cuando WebGL falla y con la preferencia de movimiento reducido. Los botones permiten pausar el aura, cambiar a la vista ligera o saltar el recorrido. La animación se detiene fuera del recorrido o al ocultar la pestaña.

Contenido y símbolos: `tools/sword_content.py`. Diseño del inicio: `assets/travelling.css`. Escena 3D: `tools/sword-web/src/main.js`. Para regenerar:

```powershell
python tools/build.py
cd tools/sword-web
npm ci
npm run build
```

El modelo original en `Downloads/Espada travelling` se conserva. La copia web en `assets/sword/sword.glb` ocupa 4.866.912 bytes y tiene 94.090 triángulos; las texturas WebP miden 1536 × 1536. El informe está en `assets/sword/optimization.json`. Para volver a optimizar el original, ejecutar desde `tools/sword-web`: `npm run optimize -- "RUTA_DEL_ORIGINAL.glb"`. Este comando también copia la imagen de referencia desde la misma carpeta.

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
