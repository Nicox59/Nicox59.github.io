"""Genera un CV de dos páginas con los mismos datos confirmados del portafolio.

Requiere reportlab. El PDF se publica como descarga desde Trayectoria.
"""
from pathlib import Path
from html import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from build import NAME, EMAIL, EXPERIENCE, PROJECTS
from project_details import PROJECT_DETAILS

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output/pdf/CV-Nicolas-Araya.pdf'
INK = colors.HexColor('#122233')
MUTED = colors.HexColor('#455668')
BLUE = colors.HexColor('#11677d')

def plain(text):
    return escape(text.replace('—', '-').replace('–', '-'))

def generate():
    fonts = Path('C:/Windows/Fonts')
    pdfmetrics.registerFont(TTFont('CV', str(fonts / 'segoeui.ttf')))
    pdfmetrics.registerFont(TTFont('CVBold', str(fonts / 'seguisb.ttf')))
    pdfmetrics.registerFontFamily('CV', normal='CV', bold='CVBold')
    styles = {
        'name': ParagraphStyle('name', fontName='CVBold', fontSize=26, leading=30, textColor=INK, spaceAfter=8),
        'subtitle': ParagraphStyle('subtitle', fontName='CV', fontSize=12, leading=17, textColor=BLUE, spaceAfter=9),
        'section': ParagraphStyle('section', fontName='CVBold', fontSize=12, leading=16, textColor=BLUE, spaceBefore=10, spaceAfter=5, keepWithNext=True),
        'title': ParagraphStyle('title', fontName='CVBold', fontSize=10.5, leading=15, textColor=INK, spaceAfter=3, keepWithNext=True),
        'meta': ParagraphStyle('meta', fontName='CV', fontSize=8.5, leading=11.5, textColor=MUTED, spaceAfter=3),
        'body': ParagraphStyle('body', fontName='CV', fontSize=9.5, leading=13.5, textColor=INK, spaceAfter=5),
        'project': ParagraphStyle('project', fontName='CV', fontSize=9, leading=12.5, textColor=INK, spaceAfter=6),
    }
    def p(text, kind='body'):
        return Paragraph(text, styles[kind])
    story = [
        p('Nicolás Ignacio<br/>Araya Rodríguez', 'name'),
        p('Ingeniero Civil Informático · Software e innovación tecnológica', 'subtitle'),
        p(f'Santiago, Chile · <link href="mailto:{EMAIL}">{EMAIL}</link> · <link href="https://niar.cl">niar.cl</link>', 'meta'),
        p('Perfil profesional', 'section'),
        p('Desarrollo soluciones que integran software con herramientas, dispositivos y procesos. Experiencia en aplicaciones web, móviles y de escritorio, automatización, inteligencia artificial y ciberseguridad. Encargado del Laboratorio UNLi 4.0 de la Universidad San Sebastián.'),
        p('Experiencia profesional', 'section'),
    ]
    for date, role, org, detail in EXPERIENCE:
        story.append(KeepTogether([p(plain(role), 'title'), p(f'{plain(org)} · {plain(date)}', 'meta'), p(plain(detail))]))
    story.extend([
        p('Formación académica', 'section'),
        p('<b>Ingeniería Civil Informática</b> · Universidad San Sebastián<br/>Marzo 2018 - mayo 2025 · Titulado'),
        p('<b>Enseñanza media y formación técnica en Ventas</b><br/>Liceo Comercial Molina Lavín · 2012 - 2016'),
        p('Formación complementaria', 'section'),
        p('<b>Ciberseguridad para Entornos Universitarios</b> · UNIR<br/>Noviembre 2025 - enero 2026 · 150 horas · Calificación: 9,20'),
        p('<b>Cursos de redes y Linux:</b> CCNAv7 Introduction to Networks; Switching, Routing, and Wireless Essentials; NDG Linux Essentials; DevNet Associate.'),
        p('Experiencia adicional e idiomas', 'section'),
        p('Ventas: Esmax Red Limitada (octubre 2020 - septiembre 2021) y Detogni (noviembre 2016 - mayo 2017). Español nativo e inglés nivel medio.'),
        PageBreak(),
        p('Proyectos y tecnologías', 'name'),
        p('Aportes personales, alcance y resultados', 'subtitle'),
    ])
    for name, category, short, detail, tags, kind, url in PROJECTS:
        info = PROJECT_DETAILS[name]
        if name == 'Biomodelos y simuladores':
            contribution = info['contribution']
        elif name == 'Lectura de cédula NFC':
            contribution = 'Desarrollé OCR local y lectura del chip con BAC/PACE, JMRTD y comprobaciones de integridad. El prototipo no equivale a identidad verificada.'
        else:
            contribution = info['contribution']
        story.append(KeepTogether([
            p(plain(name), 'title'),
            p(f'{plain(info["status"])} · {plain(" / ".join(tags))}', 'meta'),
            p(plain(contribution), 'project'),
        ]))
    story.extend([
        p('Tecnologías principales', 'section'),
        p('Python, JavaScript, Kotlin y C#; Flask, Electron, Unity y MediaPipe. PostgreSQL, Supabase, APIs, Power Automate, YOLO, MCP, OpenXR, ARCore e Inventor.', 'project'),
        p('Herramientas complementarias', 'section'),
        p('TypeScript, Java, C, React, Kivy, PySide6, SQLAlchemy, WebSocket, Forms, Excel, Power BI, Ollama, Fusion, Blender, ESP32 y Raspberry Pi.', 'project'),
    ])
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    def frame(canvas, doc):
        canvas.setTitle('Currículum de Nicolás Araya - NIAR')
        canvas.setAuthor(NAME)
        canvas.setStrokeColor(BLUE)
        canvas.setLineWidth(2)
        canvas.line(42, A4[1]-28, A4[0]-42, A4[1]-28)
        canvas.setFont('CV', 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(42, 27, 'NIAR · niar.cl · Nicolás Araya')
        canvas.drawRightString(A4[0]-42, 27, f'{doc.page} / 2')
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=42, rightMargin=42, topMargin=42, bottomMargin=42)
    doc.build(story, onFirstPage=frame, onLaterPages=frame)
    print(OUTPUT)

if __name__ == '__main__':
    generate()
