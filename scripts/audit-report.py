#!/usr/bin/env python3
"""
Siscomura IA - Auditoria Integral del Proyecto
Reporte PDF generado con ReportLab
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib import colors

# ─── Font Registration ──────────────────────────────────────────────
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')

pdfmetrics.registerFont(TTFont('Liberation', f'{FONT_DIR}/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationBold', f'{FONT_DIR}/truetype/liberation/LiberationSans-Bold.ttf'))
registerFontFamily('Liberation', normal='Liberation', bold='LiberationBold')

# ─── Color Palette ─────────────────────────────────────────────────
C_BG         = HexColor('#f4f4f3')
C_SECTION_BG = HexColor('#eae9e8')
C_CARD_BG    = HexColor('#ebeae6')
C_TABLE_HDR  = HexColor('#6b603f')
C_COVER_BLK  = HexColor('#736a4d')
C_BORDER     = HexColor('#d7d1bd')
C_ICON       = HexColor('#7c6e46')
C_ACCENT     = HexColor('#a88827')
C_ACCENT2    = HexColor('#369cbe')
C_TEXT       = HexColor('#1f1e1c')
C_MUTED      = HexColor('#77756e')
C_SUCCESS    = HexColor('#4d8760')
C_WARNING    = HexColor('#9c824e')
C_ERROR      = HexColor('#a1473f')
C_INFO       = HexColor('#436a90')
C_WHITE      = HexColor('#ffffff')

# ─── Page Dimensions ──────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN_L = 2.2 * cm
MARGIN_R = 2.2 * cm
MARGIN_T = 2.0 * cm
MARGIN_B = 2.0 * cm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# ─── Styles ────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

s_title_cover = ParagraphStyle('TitleCover', fontName='LiberationBold', fontSize=28, leading=34,
                                textColor=C_WHITE, alignment=TA_LEFT, spaceAfter=0)
s_subtitle_cover = ParagraphStyle('SubCover', fontName='Liberation', fontSize=14, leading=20,
                                   textColor=HexColor('#e0ddd4'), alignment=TA_LEFT, spaceAfter=0)
s_meta_cover = ParagraphStyle('MetaCover', fontName='Liberation', fontSize=10, leading=14,
                               textColor=HexColor('#c0baa8'), alignment=TA_LEFT)

s_h1 = ParagraphStyle('H1', fontName='LiberationBold', fontSize=20, leading=26,
                       textColor=C_TEXT, spaceBefore=18, spaceAfter=10)
s_h2 = ParagraphStyle('H2', fontName='LiberationBold', fontSize=14, leading=20,
                       textColor=C_COVER_BLK, spaceBefore=14, spaceAfter=6)
s_h3 = ParagraphStyle('H3', fontName='LiberationBold', fontSize=11.5, leading=16,
                       textColor=C_ICON, spaceBefore=10, spaceAfter=4)
s_body = ParagraphStyle('Body', fontName='NotoSerifSC', fontSize=10, leading=16,
                        textColor=C_TEXT, alignment=TA_JUSTIFY, spaceAfter=6)
s_body_left = ParagraphStyle('BodyLeft', fontName='NotoSerifSC', fontSize=10, leading=16,
                              textColor=C_TEXT, alignment=TA_LEFT, spaceAfter=6)
s_bullet = ParagraphStyle('Bullet', fontName='NotoSerifSC', fontSize=10, leading=16,
                           textColor=C_TEXT, alignment=TA_LEFT, leftIndent=18, bulletIndent=6,
                           spaceAfter=3)
s_bullet2 = ParagraphStyle('Bullet2', fontName='NotoSerifSC', fontSize=9.5, leading=15,
                            textColor=C_TEXT, alignment=TA_LEFT, leftIndent=32, bulletIndent=20,
                            spaceAfter=2)
s_caption = ParagraphStyle('Caption', fontName='Liberation', fontSize=8.5, leading=12,
                            textColor=C_MUTED, alignment=TA_LEFT, spaceAfter=8)
s_footer = ParagraphStyle('Footer', fontName='Liberation', fontSize=8, leading=10,
                           textColor=C_MUTED, alignment=TA_CENTER)

s_cell = ParagraphStyle('Cell', fontName='Liberation', fontSize=9, leading=13,
                         textColor=C_TEXT, spaceAfter=0, spaceBefore=0)
s_cell_bold = ParagraphStyle('CellBold', fontName='LiberationBold', fontSize=9, leading=13,
                              textColor=C_TEXT)
s_cell_hdr = ParagraphStyle('CellHdr', fontName='LiberationBold', fontSize=9, leading=13,
                             textColor=C_WHITE)

s_badge_good = ParagraphStyle('BadgeGood', fontName='LiberationBold', fontSize=9, leading=13,
                               textColor=C_SUCCESS)

# ─── Helper Functions ──────────────────────────────────────────────
def section(title):
    return [
        Spacer(1, 4),
        HRFlowable(width='100%', thickness=1.5, color=C_ACCENT, spaceAfter=0, spaceBefore=6),
        Paragraph(title, s_h1),
    ]

def subsection(title):
    return [Paragraph(title, s_h2)]

def subsubsection(title):
    return [Paragraph(title, s_h3)]

def body(text):
    return [Paragraph(text, s_body)]

def bullet(text):
    return [Paragraph(f"\u2022  {text}", s_bullet)]

def bullet2(text):
    return [Paragraph(f"\u2013  {text}", s_bullet2)]

def badge(text, color=C_ACCENT):
    tbl = Table([[Paragraph(f'<font color="#{color.hexval()[2:]}">{text}</font>', s_cell_bold)]],
                 colWidths=[None])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor(f'#{color.hexval()[2:]}22')),
        ('BOX', (0, 0), (-1, -1), 0.5, color),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return [tbl, Spacer(1, 4)]

def info_box(title, text):
    data = [[Paragraph(f'<b>{title}</b>', ParagraphStyle('IBTitle', parent=s_cell, textColor=C_INFO)),
             Paragraph(text, ParagraphStyle('IBBody', parent=s_cell, textColor=C_TEXT))]]
    tbl = Table(data, colWidths=[3.2*cm, CONTENT_W - 3.2*cm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#e8eff5')),
        ('BOX', (0, 0), (-1, -1), 0.5, C_INFO),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return [tbl, Spacer(1, 6)]

def warning_box(text):
    data = [[Paragraph(f'<b>Advertencia:</b> {text}', ParagraphStyle('WB', parent=s_cell, textColor=C_ERROR))]]
    tbl = Table(data, colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f5e8e6')),
        ('BOX', (0, 0), (-1, -1), 0.5, C_ERROR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return [tbl, Spacer(1, 6)]

def make_table(headers, rows, col_widths=None):
    hdr_cells = [Paragraph(h, s_cell_hdr) for h in headers]
    data = [hdr_cells]
    for row in rows:
        data.append([Paragraph(str(c), s_cell) for c in row])
    if col_widths is None:
        col_widths = [CONTENT_W / len(headers)] * len(headers)
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), C_TABLE_HDR),
        ('TEXTCOLOR', (0, 0), (-1, 0), C_WHITE),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), C_CARD_BG))
    tbl.setStyle(TableStyle(style_cmds))
    return [tbl, Spacer(1, 8)]

# ─── Page Templates ────────────────────────────────────────────────
def cover_page(canvas, doc):
    canvas.saveState()
    # Full background
    canvas.setFillColor(C_COVER_BLK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Accent bar left
    canvas.setFillColor(C_ACCENT)
    canvas.rect(0, 0, 6*mm, PAGE_H, fill=1, stroke=0)
    # Decorative line
    canvas.setStrokeColor(HexColor('#a09878'))
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN_L, PAGE_H * 0.38, PAGE_W - MARGIN_R, PAGE_H * 0.38)
    canvas.restoreState()

def body_page(canvas, doc):
    canvas.saveState()
    # Header line
    canvas.setStrokeColor(C_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_L, PAGE_H - MARGIN_T + 4*mm, PAGE_W - MARGIN_R, PAGE_H - MARGIN_T + 4*mm)
    # Header text
    canvas.setFont('Liberation', 7.5)
    canvas.setFillColor(C_MUTED)
    canvas.drawString(MARGIN_L, PAGE_H - MARGIN_T + 6*mm, 'Siscomura.ia - Auditoria Integral del Proyecto')
    canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - MARGIN_T + 6*mm, 'Agosto 2026')
    # Footer
    canvas.line(MARGIN_L, MARGIN_B - 4*mm, PAGE_W - MARGIN_R, MARGIN_B - 4*mm)
    canvas.drawCentredString(PAGE_W / 2, MARGIN_B - 8*mm, f'{doc.page}')
    # Accent dot
    canvas.setFillColor(C_ACCENT)
    canvas.circle(PAGE_W - MARGIN_R, MARGIN_B - 7*mm, 2, fill=1, stroke=0)
    canvas.restoreState()

# ─── Build Document ────────────────────────────────────────────────
OUTPUT = '/home/z/my-project/download/auditoria-integral-siscomura-ia.pdf'
os.makedirs('/home/z/my-project/download', exist_ok=True)

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=MARGIN_L, rightMargin=MARGIN_R,
    topMargin=MARGIN_T, bottomMargin=MARGIN_B,
    title='Auditoria Integral Siscomura IA',
    author='Z.ai',
    subject='Analisis de arquitectura, seguridad y mejora del proyecto Siscomura IA',
)

elements = []

# ═══════════════════════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════════════════════
elements.append(Spacer(1, PAGE_H * 0.25))
elements.append(Paragraph('Auditoria Integral', s_title_cover))
elements.append(Paragraph('Siscomura.ia', ParagraphStyle('CoverTitle2', parent=s_title_cover, fontSize=36, leading=42)))
elements.append(Spacer(1, 12))
elements.append(Paragraph('Sistema de Generacion de Contenido Radial con Inteligencia Artificial', s_subtitle_cover))
elements.append(Spacer(1, PAGE_H * 0.18))
elements.append(Paragraph('Analisis de Arquitectura, Seguridad y Recomendaciones de Mejora', s_meta_cover))
elements.append(Spacer(1, 4))
elements.append(Paragraph('Agosto 2026  |  v1.0', s_meta_cover))
elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ═══════════════════════════════════════════════════════════════════
elements += section('Contenido')
toc_items = [
    ('1', 'Resumen Ejecutivo'),
    ('2', 'Lo Bueno del Proyecto'),
    ('3', 'Lo Regular del Proyecto'),
    ('4', 'Lo Malo del Proyecto'),
    ('5', 'Evaluacion por Modulo'),
    ('6', 'Seguridad: Auditoria Completa'),
    ('7', 'Es Necesario un Login?'),
    ('8', 'Preparacion Multi-Tenant para Venta'),
    ('9', 'Plan de Accion Priorizado'),
]
for num, title in toc_items:
    toc_data = [[Paragraph(f'<b>{num}.</b>', s_cell), Paragraph(title, s_body_left)]]
    toc_tbl = Table(toc_data, colWidths=[1*cm, CONTENT_W - 1*cm])
    toc_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LINEBELOW', (1, 0), (1, 0), 0.3, C_BORDER),
    ]))
    elements.append(toc_tbl)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 1. RESUMEN EJECUTIVO
# ═══════════════════════════════════════════════════════════════════
elements += section('1. Resumen Ejecutivo')
elements += body(
    'Siscomura.ia es una aplicacion web construida con Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Zustand y libsql/Turso '
    'que sirve como plataforma de generacion de contenido radial asistido por inteligencia artificial. El sistema esta compuesto por 11 modulos '
    'especializados que cubren desde la creacion de cunas institucionales y comerciales hasta la generacion de libretos con playlist de referencia, '
    'pasando por horoscopos semanales, contenido multicanal, perfiles de locutores para TTS, y gestion de personajes con frases para redes sociales. '
    'La aplicacion consume la API de Google Gemini (gemini-3.6-flash) con un sistema de rotacion de claves API y almacena todas las generaciones '
    'en una base de datos libsql con migracion automatica de tablas.'
)
elements += body(
    'Este documento presenta una auditoria integral que cubre cinco dimensiones criticas: la evaluacion cualitativa del proyecto '
    '(fortalezas, aspectos regulares y debilidades), un analisis modulo por modulo con recomendaciones de mejora, eliminacion o mantenimiento, '
    'una auditoria de seguridad exhaustiva, un analisis sobre la necesidad de implementar autenticacion, y finalmente un conjunto de '
    'recomendaciones para preparar la plataforma como producto multi-tenant que pueda ser comercializado con otras emisoras. '
    'El objetivo es proporcionar una hoja de ruta clara y accionable que permita al equipo tomar decisiones informadas sobre la evolucion '
    'del producto, priorizar inversiones tecnicas y mitigar riesgos de seguridad antes de cualquier despliegue en produccion o expansión comercial.'
)

# Key metrics box
metrics_data = [
    [Paragraph('<b>11</b>', ParagraphStyle('M1', parent=s_cell, alignment=TA_CENTER, fontSize=14, textColor=C_ACCENT)),
     Paragraph('<b>12</b>', ParagraphStyle('M2', parent=s_cell, alignment=TA_CENTER, fontSize=14, textColor=C_ACCENT)),
     Paragraph('<b>5</b>', ParagraphStyle('M3', parent=s_cell, alignment=TA_CENTER, fontSize=14, textColor=C_ACCENT)),
     Paragraph('<b>0</b>', ParagraphStyle('M4', parent=s_cell, alignment=TA_CENTER, fontSize=14, textColor=C_ERROR)),
     Paragraph('<b>83</b>', ParagraphStyle('M5', parent=s_cell, alignment=TA_CENTER, fontSize=14, textColor=C_ACCENT))],
    [Paragraph('Modulos', ParagraphStyle('M1b', parent=s_cell, alignment=TA_CENTER, fontSize=8, textColor=C_MUTED)),
     Paragraph('Rutas API', ParagraphStyle('M2b', parent=s_cell, alignment=TA_CENTER, fontSize=8, textColor=C_MUTED)),
     Paragraph('Tablas DB', ParagraphStyle('M3b', parent=s_cell, alignment=TA_CENTER, fontSize=8, textColor=C_MUTED)),
     Paragraph('Capas Auth', ParagraphStyle('M4b', parent=s_cell, alignment=TA_CENTER, fontSize=8, textColor=C_MUTED)),
     Paragraph('Archivos src/', ParagraphStyle('M5b', parent=s_cell, alignment=TA_CENTER, fontSize=8, textColor=C_MUTED))],
]
metrics_tbl = Table(metrics_data, colWidths=[CONTENT_W/5]*5)
metrics_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), C_CARD_BG),
    ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
    ('INNERGRID', (0, 0), (-1, -1), 0.3, C_BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
elements.append(metrics_tbl)
elements.append(Spacer(1, 8))

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 2. LO BUENO DEL PROYECTO
# ═══════════════════════════════════════════════════════════════════
elements += section('2. Lo Bueno del Proyecto')

# 2.1
elements += subsection('2.1 Arquitectura de Modulos Bien Definida')
elements += body(
    'El sistema de modulos es una de las fortalezas mas destacadas del proyecto. Cada uno de los 11 modulos tiene su propio archivo de componente '
    'React dedicado, su propio prompt en formato Markdown almacenado en la base de datos, y su propia ruta API cuando necesita logica '
    'especializada. El archivo <font face="Liberation">modules.ts</font> actua como registro centralizado con una interfaz TypeScript tipada (<font face="Liberation">ModuleDef</font>) '
    'que estandariza la configuracion de cada modulo (id, nombre, descripcion, icono, placeholder). El <font face="Liberation">module-router.tsx</font> implementa '
    'un patron de enrutamiento limpio que dirige cada moduleId a su componente especializado correspondiente, con un fallback elegante '
    'al <font face="Liberation">GenericGenerator</font> para modulos que no requieren formulario personalizado. Esta arquitectura facilita agregar nuevos modulos '
    'sin tocar la logica existente y permite que cada modulo evolucione de forma independiente sin afectar a los demas.'
)

# 2.2
elements += subsection('2.2 Sistema de Rotacion de API Keys')
elements += body(
    'La implementacion de rotacion de claves API es una solucion pragmatica y efectiva para gestionar multiples claves de Google Gemini. '
    'El sistema selecciona automaticamente la clave con menor contador de uso (<font face="Liberation">orderBy: usageCount asc</font>), lo que distribuye '
    'la carga de manera equitativa entre todas las claves disponibles. Cada generacion incrementa el contador y registra la marca de tiempo '
    'del ultimo uso, lo que permite monitorear el consumo y detectar claves que podrian estar alcanzando los limites de cuota. La interfaz de '
    'configuracion permite activar/desactivar claves sin eliminarlas, agregar nuevas con nombre descriptivo, y ver un resumen del uso acumulado. '
    'Ademas, la respuesta del GET de API Keys oculta la clave completa mostrando solo los primeros 8 y ultimos 4 caracteres, un detalle '
    'importante de seguridad que previene la exposicion accidental de credenciales en el frontend.'
)

# 2.3
elements += subsection('2.3 Prompts Editables en Base de Datos')
elements += body(
    'La decision de migrar los prompts desde archivos .md del filesystem a la tabla <font face="Liberation">Prompt</font> en libsql es una arquitectura '
    'que resuelve un problema real de Vercel: el filesystem de ejecucion es de solo lectura, lo que impedía editar prompts en produccion. '
    'La solucion implementada es elegante porque mantiene la compatibilidad con el desarrollo local a traves de un mecanismo de <font face="Liberation">seedFromFilesystem()</font> '
    'que carga los archivos .md a la base de datos automaticamente si no existen aun. El editor de prompts en la interfaz utiliza un '
    'componente de texto enriquecido (MDXEditor) que permite modificar los prompts directamente desde el navegador, y los cambios se '
    'persisten inmediatamente en la base de datos. Esta arquitectura permite a los usuarios ajustar el comportamiento de la IA sin '
    'necesitar acceso al servidor ni conocimiento tecnico sobre el deployment, lo cual es esencial para un producto que aspira a ser '
    'comercializado con otras emisoras que querran personalizar los prompts segun su identidad y audiencia.'
)

# 2.4
elements += subsection('2.4 Modulos Altamente Especializados')
elements += body(
    'Varios modulos demuestran un nivel de especializacion notable que refleja un conocimiento profundo del sector radial colombiano. '
    'El modulo de Cuñas Institucionales ofrece opciones granulares para tipo de cuña (unitario, campana, jingle), clase, duracion, '
    'tematica, tipo de rima (AABB, ABAB, ABBA, interna), cantidad de estrofas y numero de voces, creando una herramienta que un '
    'productor radial puede usar sin necesidad de entender de inteligencia artificial. El modulo de Conexion Territorial implementa '
    'un sistema dual Dia 1 (Coyuntural) y Dia 2 (Tecnico) con 5 surcos tematicos predefinidos por dia, cada uno con su propio campo '
    'de URL para fuentes de informacion, reflejando la estructura real del informativo En 5 Surcos. El Generador de Libretos incluye '
    'un parser de archivos .slseq (formato binario de StationPlaylist) y soporte para CSV y M3U, lo que permite a los locutores '
    'cargar su playlist real como contexto para la generacion de libretos, un detalle que demuestra comprension del flujo de trabajo real.'
)

# 2.5
elements += subsection('2.5 Contexto de Emisora Integrado')
elements += body(
    'La funcion <font face="Liberation">getStationContext()</font> en <font face="Liberation">gemini.ts</font> extrae automaticamente los datos de la emisora configurada '
    '(nombre, URL, email, WhatsApp, redes sociales) y los inyecta en el system instruction de cada llamada a la API de Gemini. '
    'Esto significa que todos los modulos generan contenido que ya incluye los datos de contacto reales de la emisora sin que el '
    'usuario tenga que escribirlos manualmente en cada solicitud. La tabla <font face="Liberation">StationConfig</font> almacena estos datos '
    'de forma centralizada y la interfaz de configuracion permite actualizarlos en cualquier momento. Esta integracion es especialmente '
    'valiosa para cuñas comerciales y contenido institucional, donde los datos de contacto deben aparecer de forma natural en el libreto.'
)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 3. LO REGULAR DEL PROYECTO
# ═══════════════════════════════════════════════════════════════════
elements += section('3. Lo Regular del Proyecto')

# 3.1
elements += subsection('3.1 Ausencia de Pruebas')
elements += body(
    'El proyecto no cuenta con ningun tipo de prueba automatizada: no hay tests unitarios, tests de integracion, tests de componente, '
    'ni pruebas de extremo a extremo. El directorio <font face="Liberation">tests/</font> existe pero contiene unicamente tres scripts de shell para validar '
    'la construccion del runtime de base de datos, no pruebas funcionales de la aplicacion. Para un proyecto de esta complejidad con 11 modulos, '
    '12 rutas API y logica de generacion de contenido con IA, la ausencia de pruebas representa un riesgo significativo. Cada cambio en el '
    'codigo puede introducir regresiones inadvertidas que solo se descubren cuando un usuario las encuentra en produccion. La implementacion '
    'de pruebas deberia priorizar las funciones criticas: el parser de JSON de respuestas de Gemini (que ya ha tenido bugs de parsing), '
    'el sistema de rotacion de claves API, y la distribucion de tonos/temas en el modulo de frases masivas.'
)

# 3.2
elements += subsection('3.2 Manejo de Errores Basico')
elements += body(
    'El manejo de errores en las rutas API sigue un patron simple de try/catch que devuelve un mensaje generico con status 500. Si bien esto '
    'previene que la aplicacion se caiga, no proporciona informacion suficiente para diagnosticar problemas. Por ejemplo, cuando la API de '
    'Gemini devuelve un error de cuota excedida, el usuario solo ve un mensaje generico sin saber si el problema es la clave, la cuota, '
    'o el contenido del prompt. Ademas, no hay sistema de reintentos automaticos para errores transitorios de la API (rate limiting de Gemini, '
    'timeouts de red), lo que resulta en una experiencia de usuario frustrante cuando una generacion falla por un problema temporal. '
    'Tampoco hay validacion de la estructura de la respuesta de Gemini antes de procesarla, lo que puede causar errores inesperados cuando '
    'el modelo devuelve un formato diferente al esperado.'
)

# 3.3
elements += subsection('3.3 Estado del Cliente con Zustand Minimal')
elements += body(
    'El store de Zustand (<font face="Liberation">store.ts</font>) contiene unicamente cuatro piezas de estado: la vista actual, si el sidebar esta abierto, '
    'y un flag de generacion en curso. Si bien esta simplicidad es admirable, hay Areas donde el estado podria ser mas robusto. Por ejemplo, '
    'no hay estado para manejar la sesion del usuario (porque no hay sesion), no hay cache de generaciones previas, y el flag <font face="Liberation">isGenerating</font> '
    'es global cuando deberia ser por modulo. Si un usuario inicia una generacion en el modulo de Cuñas y navega a otro modulo, el flag '
    'permanece activo bloqueando generaciones en otros modulos. Un refactoring hacia un store con slices por modulo o al menos un '
    'estado de generacion por moduleId mejoraria significativamente la experiencia de usuario sin agregar complejidad excesiva.'
)

# 3.4
elements += subsection('3.4 Esquema Prisma Obsoleto')
elements += body(
    'El archivo <font face="Liberation">prisma/schema.prisma</font> existe y define 4 modelos (ApiKey, Generation, StationConfig, ModuleConfig), pero la aplicacion '
    'no usa Prisma en runtime. En su lugar, se implemento un wrapper directo a libsql en <font face="Liberation">db.ts</font> que crea las tablas '
    'automaticamente con <font face="Liberation">ensureTables()</font>. Este esquema Prisma esta desactualizado porque no incluye la tabla <font face="Liberation">Prompt</font> '
    'que se agrego posteriormente. Tener un esquema Prisma que no se usa puede generar confusion para desarrolladores nuevos que '
    'asuman que Prisma es la capa de base de datos activa. La recomendacion es eliminar el esquema Prisma y el directorio, o documentar '
    'claramente por que existe y que no se usa, para evitar confusiones futuras durante el mantenimiento o la entrega a otros equipos.'
)

# 3.5
elements += subsection('3.5 Extraccion de Contenido Web Basica')
elements += body(
    'La extraccion de contenido de URLs se implementa con una combinacion de expresiones regulares que eliminan scripts, estilos y etiquetas '
    'HTML. Este enfoque funciona para paginas HTML estaticas pero falla con paginas que dependen de JavaScript para renderizar contenido '
    '(aplicaciones SPA, sitios con lazy loading, contenido dinamico). El modulo de fetch-url y la funcion <font face="Liberation">callGeminiWithUrl</font> '
    'truncan el contenido a 15,000 caracteres, lo cual es razonable para evitar sobrepasar el contexto de Gemini, pero no hay ningun '
    'proceso de limpieza o extraccion inteligente del texto relevante. El resultado es que se envia mucho ruido (navegacion, pies de pagina, '
    'metadatos) a Gemini junto con el contenido real. Una solucion con un scraper mas inteligente o al menos un preprocesamiento que '
    'elimine bloques de texto cortos y repeticiones mejoraria significativamente la calidad de las generaciones basadas en URLs.'
)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 4. LO MALO DEL PROYECTO
# ═══════════════════════════════════════════════════════════════════
elements += section('4. Lo Malo del Proyecto')

# 4.1
elements += subsection('4.1 Cero Autenticacion y Autorizacion')
elements += body(
    'Este es el problema mas critico del proyecto. No existe absolutamente ningun mecanismo de autenticacion o autorizacion en ninguna '
    'capa de la aplicacion. No hay middleware.ts, no hay librerias de auth instaladas, no hay pagina de login, no hay verificacion de '
    'tokens en las rutas API, y no hay proteccion de rutas en el cliente. Esto significa que cualquier persona que conozca la URL del '
    'despliegue en Vercel tiene acceso completo a: crear, leer, modificar y eliminar claves API de Gemini (con acceso a las claves '
    'completas a traves de la ruta GET que muestra el preview), editar los prompts del sistema, modificar la configuracion de la emisora, '
    'consumir cuota de API de Gemini generando contenido a costa del propietario, y eliminar el historial de generaciones. En un escenario '
    'donde alguien descubre la URL publica, podria agotar rapidamente la cuota de la API de Gemini del propietario, exponer las claves API, '
    'o modificar los prompts para generar contenido inapropiado.'
)
elements += warning_box('CRITICO: Todas las rutas API son publicas y sin proteccion. Cualquier persona con la URL puede acceder a claves API completas, consumir cuota de Gemini y modificar la configuracion del sistema.')

# 4.2
elements += subsection('4.2 API Key Expuesta en URL de Gemini')
elements += body(
    'En la funcion <font face="Liberation">callGemini()</font> en <font face="Liberation">gemini.ts</font>, la clave API se pasa directamente como parametro de consulta en la URL: '
    '<font face="Liberation">https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.key}</font>. Si bien esta es la forma '
    'documentada por Google para consumir la API REST, el problema es que la clave se almacena en la base de datos sin cifrar, se transmite '
    'completa al frontend (aunque el GET la oculta parcialmente), y se procesa en el servidor de Vercel donde los logs del hosting podrian '
    'capturarla. La combinacion de almacenamiento sin cifrar y transmision en URL crea multiples vectores de exposicion. La ruta GET de API '
    'Keys muestra los primeros 8 y ultimos 4 caracteres, lo cual es un buen paso, pero la ruta PUT acepta la clave completa en el cuerpo '
    'del request sin encriptacion, y cualquier llamada POST a las rutas de generacion puede activar el uso de esa clave.'
)

# 4.3
elements += subsection('4.3 Ausencia de Rate Limiting')
elements += body(
    'No existe ningun mecanismo de limitacion de tasa en ninguna de las 12 rutas API. Un atacante o un usuario malintencionado podria '
    'enviar miles de solicitudes de generacion en rapidas sucesion, agotando la cuota de la API de Gemini y potencialmente '
    'incurriendo en costos significativos. Para el endpoint de generacion de frases masivas, donde se pueden solicitar hasta 50 frases '
    'por llamada, el riesgo se multiplica. Vercel ofrece rate limiting a nivel de plataforma en sus planes pagos, pero no se puede depender '
    'exclusivamente de eso porque no protege contra abuso interno ni contra bots sofisticados que distribuyen solicitudes. La implementacion '
    'de rate limiting a nivel de aplicacion con herramientas como <font face="Liberation">rate-limiter-flexible</font> o el middleware de Next.js es esencial '
    'antes de cualquier despliegue publico.'
)

# 4.4
elements += subsection('4.4 Validacion de Entrada Insuficiente')
elements += body(
    'La validacion de entrada en las rutas API es minima. La mayoria solo verifica la presencia de campos obligatorios con simples '
    'condiciones if/else, sin validar tipos de datos, rangos, formatos o longitud. Por ejemplo, la ruta de generacion general acepta '
    'cualquier string como moduleId sin verificar que este en la lista de modulos permitidos (aunque si verifica que exista en el '
    'registro). La ruta de API Keys acepta cualquier string como clave sin validar que tenga el formato correcto de una clave de Google '
    'Gemini (AIza...). La ruta de frases masivas limita la cantidad a 50, pero no valida que los tonos y temas sean strings seguros. '
    'La ruta de estacion no valida que las URLs proporcionadas sean URLs validas. Esta falta de validacion sistematica abre la puerta a '
    'inyeccion de prompts, consumo excesivo de recursos, y posibles vulnerabilidades de seguridad.'
)

# 4.5
elements += subsection('4.5 typescript: ignoreBuildErrors en Produccion')
elements += body(
    'El archivo <font face="Liberation">next.config.ts</font> tiene <font face="Liberation">ignoreBuildErrors: true</font>, lo que significa que TypeScript no reporta errores durante '
    'la construccion. Si bien esto puede acelerar el desarrollo en fases tempranas, en produccion es una practica peligrosa porque permite '
    'que errores de tipos pasen desapercibidos hasta el runtime, donde causan fallos en la aplicacion que son mas dificiles de diagnosticar. '
    'Tipos incorrectos pueden provocar comportamientos inesperados como acceder a propiedades undefined, pasar argumentos equivocados a '
    'funciones, o generar respuestas con estructura incorrecta. La recomendacion es eliminar esta configuracion y resolver los errores de '
    'TypeScript antes de cada despliegue a produccion, o al menos configurar CI/CD que falle cuando haya errores de tipo en cambios a archivos '
    'de logica critica como las rutas API y la capa de base de datos.'
)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 5. EVALUACION POR MODULO
# ═══════════════════════════════════════════════════════════════════
elements += section('5. Evaluacion por Modulo')
elements += body(
    'A continuacion se presenta un analisis individual de cada uno de los 11 modulos del sistema, con una calificacion cualitativa '
    'y una recomendacion concreta de accion: <b>Mantener</b> (el modulo esta bien y no requiere cambios mayores), <b>Mejorar</b> '
    '(el modulo es valioso pero necesita ajustes especificos), o <b>Eliminar</b> (el modulo no aporta valor suficiente al producto). '
    'La calificacion considera la calidad de la implementacion, la utilidad practica para una emisora, el nivel de especializacion, '
    'y el potencial de diferenciacion comercial.'
)
elements.append(Spacer(1, 4))

# Module table
module_rows = [
    ['1', 'Cunas Institucionales', 'Alta', '746 lineas', 'Mejorar'],
    ['2', 'Cunas de Clientes', 'Alta', '~600 lineas', 'Mantener'],
    ['3', 'Horoscopo Semanal', 'Media', 'Especializado', 'Mejorar'],
    ['4', 'Bienestar Campesino', 'Media', 'Generico', 'Eliminar'],
    ['5', 'Sembrando Esperanza', 'Media', 'Generico', 'Eliminar'],
    ['6', 'Presentacion de Franjas', 'Alta', 'Especializado', 'Mantener'],
    ['7', 'Contenido Multicanal', 'Muy Alta', '723 lineas', 'Mejorar'],
    ['8', 'Conexion Territorial', 'Alta', '360 lineas', 'Mejorar'],
    ['9', 'Perfiles Locutores IA', 'Muy Alta', '716 lineas', 'Mantener'],
    ['10', 'Contenido de Personajes', 'Muy Alta', '1100+ lineas', 'Mantener'],
    ['11', 'Generador de Libretos', 'Muy Alta', '1099 lineas', 'Mejorar'],
]
elements += make_table(
    ['No.', 'Modulo', 'Utilidad', 'Complejidad', 'Accion'],
    module_rows,
    [1.2*cm, 4.5*cm, 2.2*cm, 3.0*cm, 2.5*cm]
)

# Detailed per module
modules_detail = [
    ('Modulo 1: Cunas Institucionales', 'MEJORAR',
     'Este modulo es uno de los mas completos y mejor implementados del sistema. Ofrece opciones granulares para tipo de cuña '
     '(unitario, campana, jingle), clase, duracion, tematica, tipo de rima, estrofas y voces. Sin embargo, tiene pendientes importantes: '
     'la opcion de jingle aun no esta completamente integrada con el flujo de produccion (se genera el texto pero no hay preview de audio), '
     'y la campana institucional podria beneficiarse de un sistema de versiones que permita comparar iteraciones. Recomendacion: agregar '
     'preview de audio con TTS para los jingles, implementar un sistema de favoritos para las cuñas generadas, y agregar un contador de '
     'caracteres en tiempo real que muestre si el libreto cabe en la duracion seleccionada basado en la velocidad de lectura radial promedio.'),

    ('Modulo 2: Cunas de Clientes', 'MANTENER',
     'Modulo solido y funcional que cubre las necesidades de cuñas comerciales con opciones de tipo (normal, informercial, unitaria, campana). '
     'La implementacion es correcta y el flujo de usuario es intuitivo. No se identifican mejoras criticas que requieran atencion '
     'inmediata. El modulo podria beneficiarse a futuro de integracion con un CRM para autocomplete de datos de clientes, pero esto no es '
     'prioritario para la version actual. Se recomienda mantener tal cual y enfocar los esfuerzos en modulos con mayor necesidad de mejora.'),

    ('Modulo 3: Horoscopo Semanal', 'MEJORAR',
     'El modulo funciona correctamente y genera horoscopos para los 12 signos con orientacion angelical. Sin embargo, tiene dos Areas de mejora: '
     'primero, la integracion con URLs de fuentes astrologicas (para el horoscopo semanal real basado en posiciones planetarias) no esta '
     'completamente funcional, ya que la mayoria de sitios astrologicos dependen de JavaScript para renderizar contenido. Segundo, el formato de '
     'salida podria ser mas estructurado para facilitar su lectura al aire, con marcas de pausa y enfasis que un locutor pueda seguir facilmente. '
     'Recomendacion: agregar un formato de lectura al aire con marcadores de [PAUSA], [TONO SUAVE], [TRANSICION], y mejorar la extraccion de '
     'contenido astrologico con un servicio de scraping dedicado o una API especializada.'),

    ('Modulo 4: Bienestar Campesino', 'ELIMINAR',
     'Este modulo usa el componente <font face="Liberation">GenericGenerator</font> sin ninguna personalizacion, lo que significa que es basicamente un wrapper alrededor de un textarea '
     'y un boton de generar. No aporta ninguna funcionalidad diferenciada que no pueda lograr el usuario simplemente escribiendo un prompt bien '
     'elaborado en cualquier otro modulo generico. Su tematica (salud mental para comunidades rurales) es valiosa, pero la implementacion no '
     'refleja esa especializacion. Si se desea conservar esta funcionalidad, deberia integrarse como una categoria o plantilla predefinida dentro '
     'de un modulo mas general de "contenido tematico" en lugar de ocupar un slot de modulo independiente con una implementacion tan basica.'),

    ('Modulo 5: Sembrando Esperanza', 'ELIMINAR',
     'Situacion identica al modulo de Bienestar Campesino: usa el <font face="Liberation">GenericGenerator</font> sin personalizacion. Es un modulo que ocupa un '
     'espacio en la sidebar y en el registro de modulos sin aportar valor diferenciado. La tematica de motivacion en fe es especifica y valiosa '
     'para la audiencia de SISCOMURA, pero la implementacion no justifica un modulo independiente. Recomendacion: convertirlo en una plantilla '
     'de prompt predefinida o integrarlo como sub-funcionalidad del modulo de Cuñas Institucionales (como un tipo de micro-programa), '
     'liberando asi espacio en la interfaz para modulos que realmente aportan valor diferenciado.'),

    ('Modulo 6: Presentacion de Franjas', 'MANTENER',
     'Modulo especializado y funcional que genera libretos de presentacion para las franjas de programacion diaria. La implementacion '
     'es apropiada para su proposito y el resultado es directamente util para la operacion de la emisora. Este tipo de contenido se genera '
     'diariamente y tenerlo automatizado ahorra tiempo significativo a los locutores y productores. No se requieren cambios mayores, aunque '
     'podria mejorarse en el futuro con integracion directa al sistema de programacion (si existe) para auto-poblar la lista de franjas.'),

    ('Modulo 7: Contenido Multicanal', 'MEJORAR',
     'Este es uno de los modulos mas ambiciosos y valiosos del sistema. Implementa un flujo secuencial de 5 fases (Noticia Radio, Flashes, '
     'Articulo SEO, Prompts de Imagenes, Publicaciones Redes) donde cada fase usa el resultado de la anterior como contexto, creando una '
     'cadena de generacion que maximiza la coherencia entre canales. Sin embargo, tiene un punto critico: si falla una fase intermedia, '
     'no hay mecanismo de reintentos parciales, lo que obliga al usuario a reiniciar todo el flujo desde la fase 1. Recomendacion: implementar '
     'cache de resultados por fase, permitir regenerar una fase individual sin perder las demas, agregar un boton de "exportar todo" que '
     'genere un paquete descargable con los 5 contenidos en formato organizado, y agregar un preview visual para los prompts de imagenes.'),

    ('Modulo 8: Conexion Territorial', 'MEJORAR',
     'La implementacion del sistema dual Dia 1/Dia 2 con 5 surcos por dia es excelente y refleja la estructura real del informativo. '
     'Sin embargo, la funcionalidad de URL por surco (que permite asociar una fuente de noticia a cada surco) aun no esta completamente '
     'conectada: las URLs se envian a la API pero no se extrae el contenido real de cada URL de forma individual por surco (se pasan '
     'como lista al prompt). Ademas, no hay persistencia de las fuentes (si el usuario recarga, pierde las URLs ingresadas). Recomendacion: '
     'implementar la extraccion individual de contenido por URL y surco, agregar persistencia local de las fuentes con localStorage, y crear '
     'un historial de ediciones previas del informativo para permitir comparar versiones entre dias.'),

    ('Modulo 9: Perfiles Locutores IA', 'MANTENER',
     'Modulo destacado que genera perfiles de voz para Google TTS con un nivel de detalle impresionante: voz, perfil de audio, estilo, '
     'cadencia, temperatura de expresividad, escena acustica, contexto de muestra, etiquetas SSML sugeridas, y ademas genera una version '
     'en ingles optimizada para el motor TTS de Gemini. La interfaz permite editar manualmente cada campo despues de la generacion y '
     'incluye una guia de referencia de etiquetas de audio SSML. Este modulo tiene un alto valor diferenciador y no necesita cambios '
     'mayores. Podria mejorarse a futuro con preview de audio directamente en la interfaz usando la API de TTS de Google.'),

    ('Modulo 10: Contenido de Personajes', 'MANTENER',
     'El modulo mas complejo y versatil del sistema con mas de 1,100 lineas de codigo. Ofrece tres funcionalidades en tabs: fichas de personajes '
     '(generacion de perfiles detallados), campanas de contenido (generacion de posts para Facebook con prompts de imagen para Flow), y '
     'frases masivas tipo X/Twitter con distribucion multi-tono y multi-tema. La implementacion de seleccion multiple de tonos con '
     'distribucion equitativa es innovadora y la exportacion CSV con columna de tono es practica. Los personajes predefinidos (Don Evaristo, '
     'Mama Justina, Don Polo) estan bien caracterizados con descripciones fisicas detalladas. Es un modulo que se mantiene como esta, con '
     'posibles mejoras menores como agregar mas personajes predefinidos o permitir importar/exportar personajes personalizados.'),

    ('Modulo 11: Generador de Libretos', 'MEJORAR',
     'Otro modulo destacado con 1,099 lineas que incluye un parser de archivos .slseq (formato binario de StationPlaylist), soporte para CSV y M3U, '
     'y una interfaz que permite gestionar la playlist de canciones como contexto para la generacion. Sin embargo, el parser de .slseq usa '
     'extraccion de strings del binario que podria fallar con versiones nuevas del formato. Recomendacion: agregar validacion del formato '
     'de archivo antes de procesarlo, implementar un mecanismo de drag-and-drop para la carga de playlists, agregar soporte para otros formatos '
     'de playlist comunes en radio (como los formatos de RadioBoss o ZaraRadio), y permitir guardar y reutilizar playlists frecuentes '
     'en la base de datos para no tener que cargarlas en cada sesion.'),
]

for mod_title, action, description in modules_detail:
    elements += subsubsection(mod_title)
    action_color = C_SUCCESS if action == 'MANTENER' else (C_WARNING if action == 'MEJORAR' else C_ERROR)
    elements += badge(action, action_color)
    elements += body(description)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 6. SEGURIDAD
# ═══════════════════════════════════════════════════════════════════
elements += section('6. Seguridad: Auditoria Completa')

# 6.1
elements += subsection('6.1 Vulnerabilidades Criticas')

vuln_rows = [
    ['CRITICA', 'Sin autenticacion', 'Cualquier persona con la URL tiene acceso total al sistema, incluyendo claves API', 'Inmediata'],
    ['CRITICA', 'Claves API sin cifrar', 'Las claves de Gemini se almacenan en texto plano en la base de datos libsql', 'Inmediata'],
    ['CRITICA', 'API Keys expuestas en GET', 'La ruta GET /api/keys muestra parcialmente las claves (8+4 chars). La ruta PUT acepta claves completas sin validacion', 'Inmediata'],
    ['ALTA', 'Sin rate limiting', 'No hay limite de solicitudes. Un atacante puede agotar la cuota de Gemini rapidamente', 'Corto plazo'],
    ['ALTA', 'Validacion de entrada insuficiente', 'Las rutas API no validan tipos, rangos ni formatos de los datos de entrada', 'Corto plazo'],
    ['ALTA', 'Prompt injection', 'Los prompts del usuario se concatenan directamente sin sanitizacion, permitiendo inyeccion de instrucciones', 'Corto plazo'],
    ['MEDIA', 'Sin CSRF protection', 'No hay tokens CSRF en las rutas de escritura (POST, PUT, DELETE)', 'Medio plazo'],
    ['MEDIA', 'Sin CORS configurado', 'No hay configuracion explicita de CORS, usando el default de Next.js que permite cualquier origen', 'Medio plazo'],
    ['MEDIA', 'Sin headers de seguridad', 'Faltan headers como X-Content-Type-Options, X-Frame-Options, Content-Security-Policy', 'Medio plazo'],
    ['BAJA', 'Dependencias desactualizadas', 'No hay proceso automatizado de actualizacion de dependencias', 'Largo plazo'],
    ['BAJA', 'ignoreBuildErrors: true', 'TypeScript no valida tipos en build, permitiendo errores en produccion', 'Medio plazo'],
    ['BAJA', 'Sin logs de auditoria', 'No hay registro de quien realizo cada accion (no hay quien porque no hay auth)', 'Medio plazo'],
]
elements += make_table(
    ['Severidad', 'Vulnerabilidad', 'Descripcion', 'Prioridad'],
    vuln_rows,
    [2.0*cm, 3.2*cm, 7.0*cm, 2.2*cm]
)

# 6.2
elements += subsection('6.2 Recomendaciones de Seguridad')

security_recs = [
    ('Implementar autenticacion (Prioridad Inmediata)',
     'Agregar NextAuth.js o Clerk como proveedor de autenticacion. Recomendacion: Clerk por su facilidad de implementacion, UI preconstruida, '
     'soporte para magic links (ideal para usuarios no tecnicos) y gestion de usuarios integrada. Configurar un middleware.ts que proteja todas '
     'las rutas API y la pagina principal. Para el escenario de venta a otras emisoras, Clerk permite multi-tenancy nativo con organizaciones.'),
    ('Cifrar claves API en la base de datos (Prioridad Inmediata)',
     'Implementar un esquema de encriptacion AES-256 para las claves API almacenadas en la tabla ApiKey. Usar una clave maestra almacenada '
     'como variable de entorno en Vercel (environment variable encriptada). Al crear o actualizar una clave, cifrarla antes de almacenarla. '
     'Al leer, descifrar solo cuando se necesita hacer la llamada a la API de Gemini. Esto protege las claves incluso si la base de datos '
     'es comprometida.'),
    ('Implementar rate limiting (Prioridad Corto Plazo)',
     'Usar <font face="Liberation">rate-limiter-flexible</font> con almacenamiento en libsql o en memoria. Configurar limites por ruta: generacion de contenido '
     '(20 req/min por usuario), edicion de prompts (5 req/min), y gestion de API keys (3 req/min). Para Vercel, considerar tambien el uso '
     'de Vercel Rate Limiting en el archivo vercel.json como capa adicional de proteccion.'),
    ('Validar entrada con Zod en todas las rutas (Prioridad Corto Plazo)',
     'Zod ya esta instalado como dependencia del proyecto. Crear schemas de validacion para cada ruta API y usarlos como primer paso en cada '
     'handler. Esto previene inyeccion de prompts, datos malformados, y consume excesivo de recursos. Ejemplo: el campo quantity deberia ser un '
     'numero entero entre 1 y 50, los tonos deberian ser un array de valores de un enum predefinido, y las URLs deberian validarse con z.string().url().'),
    ('Agregar headers de seguridad (Prioridad Medio Plazo)',
     'Configurar los siguientes headers de seguridad en next.config.ts o via middleware: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, '
     'X-XSS-Protection: 1, Strict-Transport-Security (HSTS), Referrer-Policy: strict-origin-when-cross-origin, y un Content-Security-Policy '
     'que restrinja las fuentes de scripts, estilos y conexiones a dominios confiables.'),
    ('Sanitizar prompts de usuario (Prioridad Corto Plazo)',
     'Implementar una funcion de sanitizacion que elimine o escape instrucciones de sistema en los prompts del usuario antes de concatenarlos '
     'con los prompts del sistema. Esto previene que un usuario malintencionado sobreescriba las instrucciones del system prompt. Una tecnica '
     'efectiva es envolver el prompt del usuario en etiquetas XML y agregar una instruccion al system prompt que indique que solo debe procesar '
     'el contenido dentro de esas etiquetas.'),
]

for title, desc in security_recs:
    elements += subsubsection(title)
    elements += body(desc)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 7. ES NECESARIO UN LOGIN?
# ═══════════════════════════════════════════════════════════════════
elements += section('7. Es Necesario un Login?')

elements += body(
    '<b>Respuesta corta: Absolutamente si, y de forma inmediata.</b> No es una question de "si" sino de "como" y "cuanto". '
    'La aplicacion ya esta desplegada en Vercel con una URL publica, lo que significa que es accesible desde cualquier navegador en el mundo. '
    'Sin autenticacion, la situacion actual es equivalente a dejar la puerta abierta de una oficina que contiene informacion confidencial '
    '(claves API con acceso a servicios de pago) y herramientas de produccion (generacion de contenido que consume recursos de la cuota de Gemini).'
)

elements += subsection('7.1 Por que es Critico')
elements += bullet('Las claves API de Gemini son credenciales de pago. Alguien externo puede usarlas para generar contenido a su costa, potencialmente agotando la cuota mensual en horas si se automatiza el abuso.')
elements += bullet('Las claves API se almacenan sin cifrar en la base de datos. Si la base de datos de Turso es accesible (por ejemplo, a traves de la URL de conexion que se pasa como variable de entorno), un atacante obtendria todas las claves en texto plano.')
elements += bullet('Un atacante puede modificar los prompts del sistema para que generen contenido inapropiado que se asociaria con la marca de la emisora si se publica sin revision.')
elements += bullet('Puede modificar la configuracion de la emisora (nombre, redes sociales) para suplantar la identidad de la estacion.')
elements += bullet('Puede eliminar el historial de generaciones, causando perdida de trabajo del equipo de produccion.')

elements += subsection('7.2 Opcion Recomendada: Clerk')
elements += body(
    'Para este proyecto, se recomienda Clerk como proveedor de autenticacion por las siguientes razones: primero, tiene una interfaz de usuario '
    'preconstruida que incluye login, registro y recuperacion de contrasena sin necesidad de desarrollar estos componentes. Segundo, soporta '
    'magic links (inicio de sesion por correo electronico sin contrasena), lo cual es ideal para usuarios no tecnicos como locutores y '
    'productores radiales. Tercero, tiene soporte nativo para organizaciones (multi-tenancy), lo cual es esencial si se planea vender la '
    'aplicacion a otras emisoras. Cuarto, el SDK de Clerk para Next.js es robusto y bien mantenido, con middleware que protege rutas facilmente. '
    'Quinto, tiene un plan gratuito generoso que permite hasta 10,000 usuarios activos mensuales, mas que suficiente para una sola emisora.'
)

elements += info_box('Alternativa:', 'Si se prefiere no depender de un servicio externo, NextAuth.js (Auth.js) es la alternativa open-source. Requiere mas desarrollo '
                  '(crear la UI de login, gestionar sesiones) pero no tiene costos por usuario y permite usar proveedores OAuth o credenciales propias.')

elements += subsection('7.3 Implementacion Minima Recomendada')
elements += body(
    'La implementacion minima de autenticacion deberia incluir los siguientes componentes: un <font face="Liberation">middleware.ts</font> que redirija a la pagina de login '
    'a cualquier usuario no autenticado que intente acceder a cualquier ruta; proteccion en cada ruta API que verifique la sesion del usuario '
    'usando <font face="Liberation">auth()</font> de Clerk; un componente <font face="Liberation">UserButton</font> en la sidebar que permita cerrar sesion; y configuracion de '
    'la organizacion por defecto que se asigne automaticamente a los primeros usuarios registrados. El esfuerzo estimado para esta implementacion '
    'es de 2 a 4 horas para un desarrollador familiarizado con Next.js.'
)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 8. PREPARACION MULTI-TENANT
# ═══════════════════════════════════════════════════════════════════
elements += section('8. Preparacion Multi-Tenant para Venta')
elements += body(
    'Para que Siscomura.ia pueda ser comercializado como producto SaaS para otras emisoras, es necesario implementar una arquitectura '
    'multi-tenant donde cada emisora tenga sus datos aislados, su propia configuracion, y sus propios prompts personalizados. A continuacion '
    'se detallan los cambios necesarios organizados por Area y nivel de complejidad.'
)

# 8.1
elements += subsection('8.1 Cambios en la Base de Datos')
elements += body(
    'La base de datos actual tiene un diseno single-tenant donde todas las tablas comparten datos globalmente. Para soportar multiples emisoras, '
    'es necesario agregar un campo <font face="Liberation">organizationId</font> (o <font face="Liberation">stationId</font>) a cada tabla como clave de particion. La alternativa es usar un enfoque de '
    'base de datos separada por inquilino (una base de datos Turso por emisora), que es mas simple de implementar y ofrece aislamiento total, '
    'pero agrega complejidad operacional. Para la fase inicial, se recomienda el enfoque de columna <font face="Liberation">organizationId</font> con filtros en cada consulta. '
    'Las tablas que necesitan modificacion son: ApiKey (cada emisora gestiona sus propias claves), Generation (el historial debe estar aislado '
    'por emisora), StationConfig (cada emisora tiene su propia configuracion), ModuleConfig (cada emisora puede activar/desactivar modulos), '
    'y Prompt (cada emisora puede personalizar sus prompts o usar los defaults del sistema).'
)

# 8.2
elements += subsection('8.2 Modelo de Datos por Emisora')
tenant_rows = [
    ['ApiKey', 'organizationId', 'TEXT FK', 'Cada emisora tiene sus propias claves de Gemini'],
    ['Generation', 'organizationId', 'TEXT FK', 'Historial aislado por emisora'],
    ['StationConfig', 'organizationId', 'TEXT FK', 'Configuracion independiente de la emisora'],
    ['ModuleConfig', 'organizationId', 'TEXT FK', 'Modulos activos por emisora'],
    ['Prompt', 'organizationId', 'TEXT NULLABLE', 'NULL = prompt default del sistema, valor = personalizado'],
    ['Character', 'organizationId', 'TEXT FK', 'Personajes personalizados por emisora (nueva tabla)'],
]
elements += make_table(
    ['Tabla', 'Campo Agregado', 'Tipo', 'Descripcion'],
    tenant_rows,
    [2.8*cm, 3.0*cm, 2.0*cm, 6.6*cm]
)

# 8.3
elements += subsection('8.3 Cambios en la Capa de Aplicacion')
elements += body(
    'La capa de aplicacion requiere modificaciones significativas. El wrapper de base de datos (<font face="Liberation">db.ts</font>) necesita ser extendido para '
    'aceptar y filtrar por <font face="Liberation">organizationId</font> en todas las operaciones. Cada ruta API debe extraer el organizationId del contexto de '
    'autenticacion (disponible a traves de Clerk o NextAuth) y pasarlo a las funciones de base de datos. La funcion <font face="Liberation">getStationContext()</font> en <font face="Liberation">gemini.ts</font> '
    'ya usa la tabla StationConfig, por lo que una vez que esta tabla tenga aislamiento por organizacion, el contexto se obtendra automaticamente '
    'para la emisora correcta. Los componentes del frontend no necesitan cambios significativos porque la seleccion de la organizacion se maneja '
    'a nivel de sesion de usuario, no en el cliente.'
)

# 8.4
elements += subsection('8.4 Arquitectura de Despliegue Multi-Tenant')
elements += body(
    'Para el despliegue multi-tenant, se recomienda mantener la arquitectura actual de Vercel + Turso con las siguientes adaptaciones: usar '
    'un unico despliegue de Vercel que sirva a todas las emisoras (shared app), con la separacion de datos ocurriendo a nivel de base de datos '
    'a traves del organizationId. Esto es mas eficiente y economico que crear un despliegue separado por emisora. Turso soporta grupos de bases '
    'de datos que pueden escalar independientemente, lo que permite que cada emisora tenga su propia base de datos si se prefiere un aislamiento '
    'mas fuerte. Para la facturacion, se necesita un sistema de suscripcion que controle el acceso basado en el plan de cada emisora: plan '
    'gratuito (limite de generaciones mensuales, un solo usuario), plan basico (mas generaciones, hasta 3 usuarios), y plan premium '
    '(generaciones ilimitadas, usuarios ilimitados, soporte prioritario, prompts personalizados pre-cargados).'
)

# 8.5
elements += subsection('8.5 Consideraciones Legales y de Licenciamiento')
elements += body(
    'Al vender la aplicacion a otras emisoras, es necesario considerar los siguientes aspectos legales: primero, la licencia de la API de '
    'Google Gemini. Las claves API de Gemini son personales e intransferibles segun los terminos de servicio de Google, lo que significa '
    'que cada emisora debe obtener y configurar sus propias claves. La aplicacion debe facilitar este proceso pero nunca proporcionar claves '
    'compartidas. Segundo, los prompts del sistema pueden contener propiedad intelectual (marcas, nombres, formatos especfficos de SISCOMURA) '
    'que deben ser removidos o parametrizados en la version comercial. Tercero, se necesita un acuerdo de nivel de servicio (SLA) que defina '
    'la disponibilidad esperada, los tiempos de respuesta, y la responsabilidad en caso de caida del servicio. Cuarto, la politicas de '
    'privacidad deben cumplir con la legislacion colombiana (Ley 1581 de 2012 de Proteccion de Datos Personales) y cualquier otra aplicable '
    'en los paises donde operen las emisoras clientes.'
)

elements.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# 9. PLAN DE ACCION PRIORIZADO
# ═══════════════════════════════════════════════════════════════════
elements += section('9. Plan de Accion Priorizado')
elements += body(
    'El siguiente plan organiza todas las recomendaciones en cuatro fases con plazos estimados. Las fases estan ordenadas por prioridad, '
    'empezando por las acciones criticas de seguridad que deben implementarse inmediatamente, seguidas por las mejoras funcionales que '
    'agregan valor al producto, y culminando con los preparativos para la comercializacion multi-tenant.'
)

# Phase 1
elements += subsection('Fase 1: Seguridad Critica (Semana 1-2)')
elements += body('Acciones que deben implementarse inmediatamente antes de cualquier uso en produccion:')
elements += bullet('Implementar autenticacion con Clerk: middleware.ts, proteccion de rutas API, UserButton en sidebar. Esfuerzo: 2-4 horas.')
elements += bullet('Cifrar claves API con AES-256 antes de almacenar en la base de datos. Agregar la clave maestra como environment variable en Vercel. Esfuerzo: 3-5 horas.')
elements += bullet('Agregar rate limiting con rate-limiter-flexible: 20 req/min para generacion, 5 req/min para escritura, 3 req/min para gestion de claves. Esfuerzo: 2-3 horas.')
elements += bullet('Implementar validacion Zod en todas las rutas API. Crear schemas por ruta y aplicarlos como primer paso en cada handler. Esfuerzo: 4-6 horas.')
elements += bullet('Sanitizar prompts de usuario para prevenir inyeccion de instrucciones. Esfuerzo: 1-2 horas.')
elements += bullet('Activar ignoreBuildErrors: false y resolver errores de TypeScript existentes. Esfuerzo: 3-5 horas.')

# Phase 2
elements += subsection('Fase 2: Estabilidad y Calidad (Semana 3-4)')
elements += body('Acciones para mejorar la robustez y confiabilidad del sistema:')
elements += bullet('Agregar headers de seguridad en next.config.ts o middleware: CSP, HSTS, X-Frame-Options, X-Content-Type-Options. Esfuerzo: 1-2 horas.')
elements += bullet('Mejorar el manejo de errores: distinguir entre errores de API (cuota, auth, timeout) y mostrar mensajes especificos al usuario. Implementar reintentos automaticos para errores transitorios. Esfuerzo: 3-4 horas.')
elements += bullet('Mejorar el parser de JSON de respuestas de Gemini: agregar logging de respuestas fallidas para depuracion, implementar fallbacks robustos. Esfuerzo: 2-3 horas.')
elements += bullet('Refactorizar el estado de Zustand: hacer isGenerating por modulo en lugar de global. Esfuerzo: 1-2 horas.')
elements += bullet('Eliminar el esquema Prisma obsoleto y el directorio prisma/ para evitar confusion. Esfuerzo: 30 minutos.')

# Phase 3
elements += subsection('Fase 3: Mejoras Funcionales (Semana 5-8)')
elements += body('Mejoras que agregan valor diferenciador al producto:')
elements += bullet('Eliminar modulos 4 y 5 (Bienestar Campesino, Sembrando Esperanza) o convertirlos en plantillas del GenericGenerator. Esfuerzo: 1-2 horas.')
elements += bullet('Mejorar modulo 7 (Contenido Multicanal): cache por fase, regeneracion parcial, exportar paquete completo. Esfuerzo: 6-8 horas.')
elements += bullet('Mejorar modulo 8 (Conexion Territorial): extraccion individual por URL/surco, persistencia de fuentes. Esfuerzo: 4-6 horas.')
elements += bullet('Mejorar modulo 11 (Generador de Libretos): validacion de formatos de playlist, drag-and-drop, guardar playlists frecuentes. Esfuerzo: 6-8 horas.')
elements += bullet('Mejorar modulo 1 (Cunas Institucionales): preview de audio TTS, contador de caracteres en tiempo real. Esfuerzo: 4-6 horas.')
elements += bullet('Agregar un modulo de "Contenido Tematico" que unifique los modulos genericos actuales y permita crear plantillas personalizables. Esfuerzo: 4-6 horas.')

# Phase 4
elements += subsection('Fase 4: Preparacion Multi-Tenant (Semana 9-12)')
elements += body('Cambios necesarios para comercializar la aplicacion:')
elements += bullet('Agregar organizationId a todas las tablas de la base de datos. Esfuerzo: 4-6 horas.')
elements += bullet('Modificar db.ts para filtrar por organizationId en todas las operaciones. Esfuerzo: 6-8 horas.')
elements += bullet('Crear sistema de onboarding: registro de nueva emisora, configuracion inicial, prompts default. Esfuerzo: 8-10 horas.')
elements += bullet('Implementar sistema de suscripcion/planes con Stripe o similar. Esfuerzo: 10-15 horas.')
elements += bullet('Parametrizar prompts del sistema para eliminar referencias a SISCOMURA y hacerlo generico. Esfuerzo: 4-6 horas.')
elements += bullet('Crear documentacion de usuario y guias de configuracion para nuevas emisoras. Esfuerzo: 8-12 horas.')
elements += bullet('Implementar dashboard de administracion para gestionar multiples emisoras (super-admin). Esfuerzo: 10-15 horas.')

# Effort summary
elements += subsection('Resumen de Esfuerzo Total')
effort_rows = [
    ['Fase 1: Seguridad Critica', '15-25 horas', '1-2 semanas', 'Inmediata'],
    ['Fase 2: Estabilidad', '8-14 horas', '1-2 semanas', 'Despues de Fase 1'],
    ['Fase 3: Mejoras', '25-32 horas', '3-4 semanas', 'Despues de Fase 2'],
    ['Fase 4: Multi-Tenant', '50-72 horas', '3-4 semanas', 'Despues de Fase 3'],
    ['TOTAL', '98-143 horas', '8-12 semanas', ''],
]
elements += make_table(
    ['Fase', 'Esfuerzo', 'Duracion', 'Dependencia'],
    effort_rows,
    [4.0*cm, 3.0*cm, 3.0*cm, 4.4*cm]
)

elements += body(
    'Este plan supone un desarrollador trabajando a tiempo parcial (20 horas semanales). Con un desarrollador a tiempo completo, los tiempos '
    'se reducen aproximadamente a la mitad. La Fase 1 (Seguridad Critica) deberia comenzar inmediatamente ya que la aplicacion esta actualmente '
    'desplegada y accesible publicamente sin ninguna proteccion. Las fases subsiguientes pueden ejecutarse de forma secuencial o con cierto '
    'paralelismo entre Areas no dependientes (por ejemplo, las mejoras de modulos en Fase 3 pueden trabajarse en paralelo por modulo).'
)

# ─── Build ─────────────────────────────────────────────────────────
doc.build(elements, onFirstPage=cover_page, onLaterPages=body_page)
print(f'PDF generado: {OUTPUT}')
