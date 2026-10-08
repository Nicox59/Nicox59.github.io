"""Galerías de evidencia real, sin modificar las fotografías originales."""
from html import escape

DENTAL_PHOTOS = [
    ('odontologia-craneo-terminado.jpeg', 'Vista frontal de un biomodelo craneal impreso.', 'Biomodelo craneal impreso: vista frontal.'),
    ('odontologia-modelo-digital.jpeg', 'Modelo digital de una mandíbula en el laminador de impresión 3D.', 'Preparación digital de una mandíbula para impresión 3D.'),
    ('odontologia-resina.jpeg', 'Piezas dentales durante una impresión en resina.', 'Impresión de piezas dentales en resina.'),
    ('odontologia-mandibula-impresa.jpeg', 'Mandíbula impresa sobre la plataforma de una impresora 3D.', 'Mandíbula impresa en la plataforma de fabricación.'),
    ('odontologia-craneo-impresion.jpeg', 'Biomodelo craneal sobre la plataforma de impresión.', 'Biomodelo craneal durante el proceso de impresión.'),
    ('biomodelos-componentes.jpg', 'Conjunto de piezas anatómicas impresas, incluida una columna vertebral.', 'Conjunto de piezas anatómicas impresas para trabajo con biomodelos.'),
]

def evidence_gallery(name, photos):
    items = []
    for filename, alt, caption in photos:
        src = '/assets/projects/' + filename
        items.append(f'''<figure><button type="button" class="evidence-thumbnail" data-gallery-image="{escape(src, quote=True)}" data-gallery-caption="{escape(caption, quote=True)}" aria-label="Ampliar: {escape(alt, quote=True)}"><img src="{escape(src, quote=True)}" alt="{escape(alt, quote=True)}" loading="lazy" decoding="async"><span aria-hidden="true">Ampliar ↗</span></button><figcaption>{escape(caption)}</figcaption></figure>''')
    return f'<div class="evidence-gallery" data-project="{escape(name, quote=True)}">{"".join(items)}</div>'

def dental_highlight():
    selected = [DENTAL_PHOTOS[i] for i in (0, 1, 3)]
    return f'''<section class="section evidence-highlight" id="evidencia"><div><p class="eyebrow">Evidencia / Odontología digital</p><h2>Del modelo digital<br>a la pieza impresa.</h2><p>Fotografías del trabajo con biomodelos para el proyecto de Odontología digital del Hospital Félix Bulnes junto a la USS: preparación digital, impresión 3D y piezas físicas.</p><a class="text-link" href="./proyectos/#biomodelos">Ver fotografías del proyecto →</a></div>{evidence_gallery('Odontología digital · Biomodelos', selected)}</section>'''

def evidence_dialog():
    return '''<dialog class="evidence-dialog" id="evidence-viewer" aria-labelledby="evidence-viewer-title"><div class="evidence-viewer-header"><h2 id="evidence-viewer-title">Evidencia del proyecto</h2><button type="button" class="evidence-close" aria-label="Cerrar fotografía" autofocus>Cerrar ×</button></div><div class="evidence-viewer-image"><img id="evidence-viewer-image" alt=""></div><p class="evidence-viewer-caption" id="evidence-viewer-caption"></p><div class="evidence-viewer-controls"><button type="button" data-gallery-prev aria-label="Fotografía anterior">← Anterior</button><span id="evidence-viewer-count" aria-live="polite"></span><button type="button" data-gallery-next aria-label="Fotografía siguiente">Siguiente →</button></div></dialog>'''
