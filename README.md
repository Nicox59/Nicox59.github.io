# NIAR — Portafolio de Nicolás Araya

Sitio estático preparado para GitHub Pages. Incluye biografía, proyectos, trayectoria y contacto. No necesita servidor Python ni dependencias para publicarse.

## Editar contenido

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
