# NIAR — Portafolio de Nicolás Araya

Sitio estático preparado para GitHub Pages. Incluye biografía, proyectos, trayectoria y contacto. No necesita servidor Python ni dependencias para publicarse.

## Editar contenido

Editar `tools/build.py` y ejecutar `python tools/build.py`. El generador actualiza `index.html`, `proyectos/index.html`, `cv/index.html`, `contacto/index.html` y `404.html`. Los archivos HTML generados deben incluirse al publicar cambios.

El diseño está en `assets/site.css`; el menú móvil y la impresión del CV están en `assets/site.js`. Las ilustraciones SVG son decorativas y no representan capturas de las aplicaciones.

## Vista previa

Desde esta carpeta, ejecutar `python -m http.server 8765 --bind 127.0.0.1` y abrir `http://127.0.0.1:8765`.

## GitHub Pages

Repositorio público: [Nicox59/Nicox59.github.io](https://github.com/Nicox59/Nicox59.github.io). GitHub Pages está habilitado desde la rama `main`, carpeta `/ (root)`, con HTTPS. Sitio actual: [nicox59.github.io](https://nicox59.github.io/). `.nojekyll` permite servir los archivos tal como están.

La conexión del dominio `niar.cl` está pendiente del acceso al editor de zona DNS de INC.

## Dominio niar.cl

Agregar primero `niar.cl` en Settings → Pages → Custom domain. Si se publica desde una rama, GitHub genera un archivo `CNAME`; sincronizar ese cambio en el checkout local.

En el administrador de zona DNS de INC, configurar estos registros:

| Nombre | Tipo | Destino |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `nicox59.github.io` |

Reemplazar solamente los registros web incompatibles de `@` y `www`, conservando los registros de correo y otros servicios. Mantener los nameservers de INC si su zona DNS se administra allí. Las direcciones de GitHub Pages no son nameservers y no se ingresan en el formulario “Cambiar Nameservers”.

El panel revisado de INC muestra Nameservers y Servidores DNS Privados, pero todavía no se ha encontrado un editor de zona A/CNAME. Si no está habilitado, solicitar a INC acceso a la gestión DNS o que apliquen los registros anteriores. No es necesario contratar alojamiento web para GitHub Pages.

Cuando GitHub valide los DNS y emita el certificado, activar Enforce HTTPS. Los cambios DNS pueden tardar hasta 24 horas.

Fuentes: [dominio personalizado](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) y [publicación desde una rama](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Datos personales

El contenido profesional se adaptó del currículum aportado por el propietario. No se publica el teléfono, la comuna ni el documento Word original. El correo de contacto fue aprobado por el propietario para su publicación pública.
