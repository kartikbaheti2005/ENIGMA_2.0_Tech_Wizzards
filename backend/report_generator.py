"""
DermAssist AI — Comprehensive PDF Report Generator
All patient intake fields are used to produce a detailed clinical report.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.graphics.shapes import Drawing, Rect
from io import BytesIO
from datetime import datetime
import json

# ── Palette ───────────────────────────────────────────────────────────────────
BLUE      = colors.HexColor('#1d4ed8')
BLUE_DARK = colors.HexColor('#1e3a8a')
BLUE_LT   = colors.HexColor('#eff6ff')
BLUE_MID  = colors.HexColor('#bfdbfe')
DARK      = colors.HexColor('#0f172a')
SLATE     = colors.HexColor('#334155')
GRAY      = colors.HexColor('#64748b')
GRAY_LT   = colors.HexColor('#f8fafc')
BORDER    = colors.HexColor('#e2e8f0')
WHITE     = colors.white

RISK_COL = {
    'High Risk':     colors.HexColor('#dc2626'),
    'Moderate Risk': colors.HexColor('#d97706'),
    'Low Risk':      colors.HexColor('#059669'),
}
RISK_BG = {
    'High Risk':     colors.HexColor('#fff5f5'),
    'Moderate Risk': colors.HexColor('#fffbeb'),
    'Low Risk':      colors.HexColor('#f0fdf4'),
}
RISK_BD = {
    'High Risk':     colors.HexColor('#fca5a5'),
    'Moderate Risk': colors.HexColor('#fcd34d'),
    'Low Risk':      colors.HexColor('#6ee7b7'),
}

SYM_RED   = colors.HexColor('#fee2e2')
SYM_GREEN = colors.HexColor('#dcfce7')
SYM_AMBER = colors.HexColor('#fef9c3')

NAME_MAP = {
    'mel':   'Melanoma',
    'bcc':   'Basal Cell Carcinoma',
    'akiec': 'Actinic Keratosis',
    'bkl':   'Benign Keratosis',
    'df':    'Dermatofibroma',
    'vasc':  'Vascular Lesion',
    'nv':    'Melanocytic Nevi',
}
CLASS_RISK = {
    'mel':'High','bcc':'High','akiec':'High',
    'bkl':'Moderate','df':'Moderate','vasc':'Moderate','nv':'Low',
}
DESCRIPTIONS = {
    'mel':   (
        'Melanoma is the most dangerous form of skin cancer, arising from melanocytes — '
        'the pigment-producing cells of the skin. It accounts for only about 1% of skin cancers '
        'but causes the vast majority of skin cancer deaths. Melanoma can spread rapidly to lymph '
        'nodes and distant organs if not detected and treated early. Key risk factors include '
        'fair skin, personal or family history of melanoma, excessive UV exposure, numerous '
        'atypical moles, and a weakened immune system.'
    ),
    'bcc':   (
        'Basal Cell Carcinoma (BCC) is the most common form of skin cancer worldwide, accounting '
        'for approximately 80% of all non-melanoma skin cancers. It arises from basal cells at '
        'the bottom of the epidermis. BCC rarely metastasizes, but can cause significant local '
        'tissue destruction, disfigurement, and recurrence if left untreated. Cumulative sun '
        'exposure over a lifetime is the primary risk factor, making it most common in older '
        'adults on sun-exposed areas such as the face, neck, and hands.'
    ),
    'akiec': (
        'Actinic Keratosis (AK), also known as solar keratosis, is a rough, scaly patch that '
        'develops on sun-damaged skin. It is considered a precancerous lesion — without treatment, '
        'approximately 5–10% of AKs can progress to squamous cell carcinoma over time. AKs are '
        'among the most common lesions treated by dermatologists and are directly caused by '
        'cumulative ultraviolet radiation exposure. They are most frequently found on the face, '
        'lips, ears, scalp, neck, and backs of the hands and forearms.'
    ),
    'bkl':   (
        'Benign Keratosis is a broad term covering non-cancerous skin growths including seborrheic '
        'keratoses and solar lentigines. Seborrheic keratoses are extremely common warty or waxy '
        'growths that appear tan, brown, or black and often have a "stuck-on" appearance. Solar '
        'lentigines (liver spots) are flat, brown, well-circumscribed macules caused by sun '
        'exposure. Both conditions are benign and require no treatment unless they cause cosmetic '
        'concern, irritation, or cannot be distinguished from malignancy without biopsy.'
    ),
    'df':    (
        'Dermatofibroma is a common, benign fibrous nodule that typically appears on the lower '
        'legs, though it can occur anywhere on the body. It usually presents as a small, firm, '
        'slightly raised or flat papule that may be pink, brown, or grey and dimples inward when '
        'squeezed (positive "dimple sign"). Dermatofibromas are harmless and generally require no '
        'treatment. Excision is occasionally performed for diagnostic certainty, cosmetic reasons, '
        'or if the lesion becomes symptomatic (itching, tenderness, or rapid growth).'
    ),
    'vasc':  (
        'Vascular Lesion refers to a group of conditions involving abnormalities of the blood '
        'vessels in or under the skin. Common types include cherry angiomas (benign overgrowths '
        'of blood vessels), spider angiomas, hemangiomas, and pyogenic granulomas. Most vascular '
        'lesions are benign and require no treatment. However, dermatological evaluation is '
        'recommended to confirm the diagnosis and rule out rarer malignant vascular tumors such '
        'as Kaposi sarcoma or angiosarcoma, especially if the lesion bleeds, grows rapidly, '
        'or appears unusual.'
    ),
    'nv':    (
        'Melanocytic Nevi (common moles) are benign growths formed by clusters of melanocytes. '
        'They are extremely common — most adults have between 10 and 40 moles. The vast majority '
        'are completely harmless. However, certain moles carry a higher risk of transforming into '
        'melanoma: those with irregular borders, multiple colors, diameter greater than 6mm, '
        'asymmetry, or that are evolving over time (ABCDE criteria). Any mole that changes '
        'in size, shape, or color, or that bleeds or itches, should be evaluated promptly by '
        'a board-certified dermatologist.'
    ),
}
RECOMMENDATIONS = {
    'High Risk': [
        'Seek an urgent dermatology appointment within 3–5 business days — do not delay.',
        'Do NOT attempt to remove, scratch, or biopsy the lesion yourself.',
        'Avoid all UV exposure on the affected area; apply SPF 50+ sunscreen and cover it.',
        'Photograph the lesion in consistent lighting every 2–3 days to track changes.',
        'If the lesion bleeds heavily, grows rapidly, or you develop fever/swollen lymph nodes, go to the nearest emergency department immediately.',
    ],
    'Moderate Risk': [
        'Schedule a dermatology consultation within 2–4 weeks.',
        'Apply the ABCDE self-examination rule weekly (Asymmetry, Border, Colour, Diameter, Evolving).',
        'Photograph the lesion under consistent lighting every 2 weeks and note any changes.',
        'Avoid excessive sun exposure and apply broad-spectrum SPF 30+ sunscreen daily.',
        'A dermatoscopic examination and possible shave or punch biopsy may be performed at your appointment.',
    ],
    'Low Risk': [
        'No immediate medical action is required at this time.',
        'Perform monthly full skin self-examinations and note any new or changing spots.',
        'Apply SPF 30+ broad-spectrum sunscreen daily, even on cloudy days.',
        'Wear protective clothing, wide-brim hats, and seek shade between 10 am–4 pm.',
        'Schedule a routine annual full-body skin check with a board-certified dermatologist.',
    ],
}
BIOMARKER_INFO = {
    'ldh':   ('LDH',   'U/L',   250.0, 'Lactate Dehydrogenase',          'Elevated in advanced melanoma, hemolysis, and liver disease. A key prognostic marker in stage III/IV melanoma.'),
    's100b': ('S100B', 'µg/L',  0.105, 'S100 Calcium Binding Protein B', 'Highly sensitive tumour marker for melanoma. Elevated levels correlate with metastatic spread and poor prognosis.'),
    'mia':   ('MIA',   'ng/mL', 9.0,   'Melanoma Inhibitory Activity',   'Secreted by melanoma cells. Rising levels indicate disease progression; used alongside S100B for staging.'),
    'vegf':  ('VEGF',  'pg/mL', 200.0, 'Vascular Endothelial GF',        'Promotes tumour angiogenesis. Elevated in many cancers; associated with increased metastatic potential.'),
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def st(size=9, bold=False, color=None, align=TA_LEFT, leading=None):
    return ParagraphStyle('_',
        fontName='Helvetica-Bold' if bold else 'Helvetica',
        fontSize=size,
        leading=leading or (size + 5),
        textColor=color or DARK,
        alignment=align,
    )

def sec(text, cw):
    """Blue section header bar."""
    t = Table([[Paragraph(text, st(9, bold=True, color=WHITE))]], colWidths=[cw])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(-1,-1), BLUE),
        ('TOPPADDING',    (0,0),(-1,-1), 2.2*mm),
        ('BOTTOMPADDING', (0,0),(-1,-1), 2.2*mm),
        ('LEFTPADDING',   (0,0),(-1,-1), 4*mm),
        ('RIGHTPADDING',  (0,0),(-1,-1), 4*mm),
    ]))
    return t

def kv(label, value, lw=38*mm, vw=40*mm):
    """Single label+value cell pair (stacked)."""
    return Table([
        [Paragraph(label, st(6.5, bold=True, color=GRAY))],
        [Paragraph(str(value) if value else '—', st(9, bold=True))],
    ], colWidths=[lw+vw],
    style=TableStyle([
        ('TOPPADDING',    (0,0),(-1,-1), 0),
        ('BOTTOMPADDING', (0,0),(-1,-1), 0),
        ('LEFTPADDING',   (0,0),(-1,-1), 0),
        ('RIGHTPADDING',  (0,0),(-1,-1), 0),
    ]))

def grid(cells_by_row, col_widths):
    """Info grid with alternating light background."""
    rows = []
    for row in cells_by_row:
        rows.append(row)
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(-1,-1), GRAY_LT),
        ('BOX',           (0,0),(-1,-1), 0.5, BORDER),
        ('INNERGRID',     (0,0),(-1,-1), 0.3, BORDER),
        ('TOPPADDING',    (0,0),(-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0),(-1,-1), 3*mm),
        ('LEFTPADDING',   (0,0),(-1,-1), 3.5*mm),
        ('RIGHTPADDING',  (0,0),(-1,-1), 3.5*mm),
        ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ]))
    return t

def flag_bg(val):
    v = (val or '').lower().strip()
    if v in ('yes', 'current', 'high', 'sometimes', 'former'):
        return SYM_RED
    if v in ('no', 'never', 'low', 'normal'):
        return SYM_GREEN
    return SYM_AMBER

def conf_drawing(conf_pct, bar_w, rcol):
    d = Drawing(bar_w, 10)
    d.add(Rect(0, 0, bar_w, 10, fillColor=BORDER, strokeColor=None))
    d.add(Rect(0, 0, bar_w * (conf_pct / 100), 10, fillColor=rcol, strokeColor=None))
    return d


# ═════════════════════════════════════════════════════════════════════════════
def generate_scan_report(scan_data: dict, user_data: dict) -> bytes:
    buf = BytesIO()
    W, H = A4
    MG   = 15 * mm
    CW   = W - 2 * MG

    doc = SimpleDocTemplate(buf, pagesize=A4,
        topMargin=MG, bottomMargin=MG, leftMargin=MG, rightMargin=MG,
        title='DermAssist AI Comprehensive Screening Report',
        author='DermAssist AI')

    story = []

    # ── Pull all values ──────────────────────────────────────────────────────
    risk      = scan_data.get('risk_level', 'Low Risk')
    dlabel    = scan_data.get('predicted_label', 'nv')
    dname     = NAME_MAP.get(dlabel, dlabel)
    conf      = float(scan_data.get('confidence_score', 0)) * 100
    scan_id   = scan_data.get('id', 0)
    created   = scan_data.get('created_at', '')

    try:
        dt        = datetime.fromisoformat(str(created).replace('Z',''))
        scan_date = dt.strftime('%d %B %Y')
        scan_time = dt.strftime('%I:%M %p')
    except Exception:
        scan_date = str(created)[:10] or 'N/A'
        scan_time = 'N/A'

    now       = datetime.now().strftime('%d %B %Y, %I:%M %p')
    report_id = f'RPT-{str(scan_id).zfill(6)}'
    rcol      = RISK_COL.get(risk, GRAY)
    rbg       = RISK_BG.get(risk, GRAY_LT)
    rbd       = RISK_BD.get(risk, BORDER)

    raw_scores = {}
    try:
        raw        = scan_data.get('raw_output', '{}')
        raw_scores = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        pass

    def g(key):
        return (user_data.get(key) or '').strip() or '—'

    full_name        = g('full_name')
    email            = g('email')
    dob              = g('date_of_birth')
    gender           = g('gender')
    phone            = g('phone_number')
    age              = g('age')
    skin_type        = g('skin_type')
    smoking          = g('smoking')
    uv_exposure      = g('uv_exposure')
    family_history   = g('family_history')
    previous_cancer  = g('previous_cancer')
    medications      = g('medications') if g('medications') not in ('—','') else 'None reported'
    new_mole         = g('new_mole')
    mole_change      = g('mole_change')
    itching          = g('itching')
    bleeding         = g('bleeding')
    sore_not_healing = g('sore_not_healing')
    spread_pigment   = g('spread_pigment')
    ldh_v            = g('ldh')
    s100b_v          = g('s100b')
    mia_v            = g('mia')
    vegf_v           = g('vegf')
    lesion_location  = g('lesion_location')
    lesion_size      = g('lesion_size')
    lesion_duration  = g('lesion_duration')

    # ════════════════════════════════════════════════════════════════════════
    # ── HEADER ──────────────────────────────────────────────────────────────
    left_hdr = Table([
        [Paragraph('DermAssist AI', st(20, bold=True, color=WHITE))],
        [Paragraph('AI-Based Skin Lesion Screening Platform', st(8, color=colors.HexColor('#bfdbfe')))],
        [Paragraph('www.dermassist.ai  ·  support@dermassist.ai', st(7, color=colors.HexColor('#93c5fd')))],
    ], colWidths=[105*mm],
    style=TableStyle([('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),1),
                      ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))

    right_hdr = Table([
        [Paragraph('COMPREHENSIVE SCREENING REPORT', st(8.5, bold=True, color=WHITE, align=TA_RIGHT))],
        [Paragraph(report_id, st(8, color=BLUE_MID, align=TA_RIGHT))],
        [Paragraph(f'Generated: {now}', st(7, color=colors.HexColor('#93c5fd'), align=TA_RIGHT))],
    ], colWidths=[58*mm],
    style=TableStyle([('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),1),
                      ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))

    hdr = Table([[left_hdr, right_hdr]], colWidths=[110*mm, 60*mm])
    hdr.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(-1,-1), BLUE),
        ('TOPPADDING',    (0,0),(-1,-1), 6*mm),
        ('BOTTOMPADDING', (0,0),(-1,-1), 6*mm),
        ('LEFTPADDING',   (0,0),(0,-1),  5*mm),
        ('RIGHTPADDING',  (1,0),(1,-1),  5*mm),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ]))
    story.append(hdr)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 1: PATIENT DEMOGRAPHICS ─────────────────────────────────────────
    story.append(sec('SECTION 1 — PATIENT DEMOGRAPHICS', CW))
    story.append(Spacer(1, 2*mm))

    c2 = CW / 2
    demo = grid([
        [kv('FULL NAME',            full_name,   c2, 0),  kv('EMAIL ADDRESS',   email,      c2, 0)],
        [kv('DATE OF BIRTH',        dob,         c2, 0),  kv('GENDER',          gender,     c2, 0)],
        [kv('AGE AT SCREENING',     f'{age} yrs' if age.isdigit() else age, c2, 0),
         kv('PHONE NUMBER',         phone,       c2, 0)],
        [kv('FITZPATRICK SKIN TYPE',skin_type,   c2, 0),  kv('REPORT ID',       report_id,  c2, 0)],
        [kv('SCAN DATE',            scan_date,   c2, 0),  kv('SCAN TIME',       scan_time,  c2, 0)],
    ], [c2, c2])
    story.append(demo)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 2: AI RESULT ────────────────────────────────────────────────────
    story.append(sec('SECTION 2 — AI ANALYSIS RESULT', CW))
    story.append(Spacer(1, 2*mm))

    bw = 65 * mm
    diag_left = Table([
        [Paragraph('PRIMARY DIAGNOSIS',   st(6.5, bold=True, color=GRAY))],
        [Paragraph(dname,                 st(17, bold=True))],
        [Paragraph(f'Diagnostic Code: {dlabel.upper()}', st(8, color=GRAY))],
        [Spacer(1, 3*mm)],
        [Paragraph('RISK CLASSIFICATION', st(6.5, bold=True, color=GRAY))],
        [Paragraph(risk,                  st(13, bold=True, color=rcol))],
        [Spacer(1, 2*mm)],
        [Paragraph('LESION LOCATION',     st(6.5, bold=True, color=GRAY))],
        [Paragraph(lesion_location,       st(10, bold=True))],
    ], colWidths=[90*mm],
    style=TableStyle([('TOPPADDING',(0,0),(-1,-1),1.5),('BOTTOMPADDING',(0,0),(-1,-1),1.5),
                      ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))

    diag_right = Table([
        [Paragraph('AI CONFIDENCE SCORE', st(7, bold=True, color=GRAY, align=TA_CENTER))],
        [Paragraph(f'{conf:.1f}%',        st(36, bold=True, color=BLUE, align=TA_CENTER))],
        [conf_drawing(conf, bw, rcol)],
        [Spacer(1, 2*mm)],
        [Paragraph('DermAssist v2.0 · MobileNetV2 · TFLite', st(7, color=GRAY, align=TA_CENTER))],
        [Paragraph('HAM10000 Dataset · 7 Classes · 128×128 px', st(7, color=GRAY, align=TA_CENTER))],
    ], colWidths=[bw],
    style=TableStyle([('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2),
                      ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))

    res = Table([[diag_left, diag_right]], colWidths=[95*mm, bw])
    res.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(0,-1), rbg),
        ('BACKGROUND',    (1,0),(1,-1), GRAY_LT),
        ('BOX',           (0,0),(-1,-1), 2, rcol),
        ('LINEAFTER',     (0,0),(0,-1), 0.5, BORDER),
        ('TOPPADDING',    (0,0),(-1,-1), 5*mm),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5*mm),
        ('LEFTPADDING',   (0,0),(-1,-1), 5*mm),
        ('RIGHTPADDING',  (0,0),(-1,-1), 5*mm),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ]))
    story.append(res)
    story.append(Spacer(1, 2*mm))

    # Lesion detail sub-row
    c4 = CW / 4
    lesion_sub = grid([[
        kv('LESION LOCATION', lesion_location, c4, 0),
        kv('APPROX SIZE',     f'{lesion_size} mm' if lesion_size not in ('—','') else '—', c4, 0),
        kv('DURATION',        lesion_duration, c4, 0),
        kv('SKIN TYPE',       skin_type.split('–')[0].strip() if '–' in skin_type else skin_type, c4, 0),
    ]], [c4, c4, c4, c4])
    story.append(lesion_sub)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 3: ABOUT THIS DIAGNOSIS ─────────────────────────────────────────
    story.append(sec('SECTION 3 — ABOUT THIS DIAGNOSIS', CW))
    story.append(Spacer(1, 2*mm))

    dbox = Table([[Paragraph(DESCRIPTIONS.get(dlabel, ''), st(9, leading=15, color=SLATE))]], colWidths=[CW])
    dbox.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(-1,-1), GRAY_LT),
        ('BOX',           (0,0),(-1,-1), 0.5, BORDER),
        ('TOPPADDING',    (0,0),(-1,-1), 4*mm),
        ('BOTTOMPADDING', (0,0),(-1,-1), 4*mm),
        ('LEFTPADDING',   (0,0),(-1,-1), 5*mm),
        ('RIGHTPADDING',  (0,0),(-1,-1), 5*mm),
    ]))
    story.append(dbox)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 4: MEDICAL HISTORY & RISK FACTORS ───────────────────────────────
    story.append(sec('SECTION 4 — PATIENT MEDICAL HISTORY & RISK FACTORS', CW))
    story.append(Spacer(1, 2*mm))

    rf_data = [
        ('Family History of Skin Cancer', family_history,
         'First-degree relatives with melanoma increase personal risk 2–3×. Individuals with an affected parent, sibling, or child should begin surveillance earlier.'),
        ('Previous Cancer Diagnosis',     previous_cancer,
         'A prior malignancy — especially melanoma — significantly increases risk of a second primary cancer and may indicate an underlying genetic predisposition.'),
        ('Smoking / Tobacco Use',         smoking,
         'Tobacco is an established carcinogen. Smoking causes immunosuppression and oxidative skin damage, increasing susceptibility to cancer development.'),
        ('UV / Sun Exposure Level',       uv_exposure,
         'Chronic ultraviolet radiation is the single largest environmental risk factor for all forms of skin cancer. High UV exposure greatly accelerates lesion formation.'),
    ]

    rf_rows = [[
        Paragraph('RISK FACTOR',          st(8, bold=True, color=WHITE)),
        Paragraph('PATIENT RESPONSE',     st(8, bold=True, color=WHITE)),
        Paragraph('CLINICAL SIGNIFICANCE',st(8, bold=True, color=WHITE)),
    ]]
    rf_style = [
        ('BACKGROUND', (0,0),(-1,0), DARK),
        ('TOPPADDING',    (0,0),(-1,-1), 2.5*mm), ('BOTTOMPADDING',(0,0),(-1,-1),2.5*mm),
        ('LEFTPADDING',   (0,0),(-1,-1), 3.5*mm), ('RIGHTPADDING', (0,0),(-1,-1),3.5*mm),
        ('BOX',    (0,0),(-1,-1), 0.5, BORDER),
        ('INNERGRID',(0,0),(-1,-1), 0.3, BORDER),
        ('VALIGN', (0,0),(-1,-1), 'MIDDLE'),
    ]
    for i, (factor, val, note) in enumerate(rf_data, 1):
        rf_rows.append([
            Paragraph(factor, st(9)),
            Paragraph(val,    st(9, bold=True)),
            Paragraph(note,   st(8, color=GRAY, leading=12)),
        ])
        rf_style.append(('BACKGROUND', (0,i),(-1,i), flag_bg(val)))

    rf_t = Table(rf_rows, colWidths=[50*mm, 32*mm, 88*mm])
    rf_t.setStyle(TableStyle(rf_style))
    story.append(rf_t)

    if medications and medications != 'None reported':
        story.append(Spacer(1, 2*mm))
        med = Table([[
            Paragraph('CURRENT MEDICATIONS', st(7, bold=True, color=GRAY)),
            Paragraph(medications, st(9)),
        ]], colWidths=[40*mm, CW - 40*mm])
        med.setStyle(TableStyle([
            ('BACKGROUND',    (0,0),(-1,-1), GRAY_LT),
            ('BOX',           (0,0),(-1,-1), 0.5, BORDER),
            ('TOPPADDING',    (0,0),(-1,-1), 3*mm), ('BOTTOMPADDING',(0,0),(-1,-1),3*mm),
            ('LEFTPADDING',   (0,0),(-1,-1), 4*mm), ('RIGHTPADDING', (0,0),(-1,-1),4*mm),
            ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ]))
        story.append(med)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 5: SYMPTOM ASSESSMENT ───────────────────────────────────────────
    story.append(sec('SECTION 5 — REPORTED SYMPTOM ASSESSMENT', CW))
    story.append(Spacer(1, 2*mm))

    note_box = Table([[Paragraph(
        'ℹ  Responses reflect changes the patient reported noticing in the past 3 months. '
        'Highlighted cells indicate findings that may carry clinical significance.',
        st(8, color=GRAY, leading=12)
    )]], colWidths=[CW])
    note_box.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), BLUE_LT),
        ('BOX',(0,0),(-1,-1),0.5,BLUE_MID),
        ('TOPPADDING',(0,0),(-1,-1),2.5*mm),('BOTTOMPADDING',(0,0),(-1,-1),2.5*mm),
        ('LEFTPADDING',(0,0),(-1,-1),4*mm),('RIGHTPADDING',(0,0),(-1,-1),4*mm),
    ]))
    story.append(note_box)
    story.append(Spacer(1, 2*mm))

    sym_data = [
        ('New Mole or Growth Appeared',       new_mole,
         'A new pigmented lesion appearing in adulthood requires clinical evaluation to exclude melanoma.'),
        ('Existing Mole Changed in Size/Shape', mole_change,
         'Morphological change is one of the most reliable early warning signs for malignant transformation.'),
        ('Itching or Pain in Lesion Area',    itching,
         'Pruritus or tenderness may indicate active inflammatory processes or early malignant change.'),
        ('Bleeding or Oozing from Lesion',    bleeding,
         'Spontaneous bleeding without trauma is a high-concern symptom warranting urgent review.'),
        ("Sore That Won't Heal",              sore_not_healing,
         'Persistent non-healing sores on sun-exposed areas are classic presentations of BCC or SCC.'),
        ('Pigment Spreading Beyond Lesion Border', spread_pigment,
         'Border irregularity and spreading pigmentation (Hutchinson sign) are key melanoma indicators.'),
    ]

    sym_rows = [[
        Paragraph('SYMPTOM',          st(8, bold=True, color=WHITE)),
        Paragraph('RESPONSE',         st(8, bold=True, color=WHITE)),
        Paragraph('CLINICAL RELEVANCE',st(8, bold=True, color=WHITE)),
    ]]
    sym_style = [
        ('BACKGROUND', (0,0),(-1,0), DARK),
        ('TOPPADDING',    (0,0),(-1,-1), 2.5*mm), ('BOTTOMPADDING',(0,0),(-1,-1),2.5*mm),
        ('LEFTPADDING',   (0,0),(-1,-1), 3.5*mm), ('RIGHTPADDING', (0,0),(-1,-1),3.5*mm),
        ('BOX',    (0,0),(-1,-1), 0.5, BORDER),
        ('INNERGRID',(0,0),(-1,-1), 0.3, BORDER),
        ('VALIGN', (0,0),(-1,-1), 'MIDDLE'),
    ]
    for i, (label, val, note) in enumerate(sym_data, 1):
        sym_rows.append([
            Paragraph(label, st(9)),
            Paragraph(val,   st(9, bold=True)),
            Paragraph(note,  st(8, color=GRAY, leading=12)),
        ])
        sym_style.append(('BACKGROUND', (0,i),(-1,i), flag_bg(val)))

    sym_t = Table(sym_rows, colWidths=[52*mm, 28*mm, 90*mm])
    sym_t.setStyle(TableStyle(sym_style))
    story.append(sym_t)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 6: BIOMARKER ANALYSIS ───────────────────────────────────────────
    story.append(sec('SECTION 6 — BIOMARKER ANALYSIS', CW))
    story.append(Spacer(1, 2*mm))

    bio_vals = {'ldh': ldh_v, 's100b': s100b_v, 'mia': mia_v, 'vegf': vegf_v}
    has_bio   = any(v not in ('—','') for v in bio_vals.values())

    if not has_bio:
        nb = Table([[Paragraph(
            'No biomarker values were provided during patient intake. '
            'If available, LDH, S100B, MIA and VEGF blood test results can meaningfully '
            'strengthen the clinical picture — particularly for high-risk AI findings. '
            'Please request these tests from your physician if not already done.',
            st(9, color=GRAY, leading=14))]], colWidths=[CW])
        nb.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1),GRAY_LT),('BOX',(0,0),(-1,-1),0.5,BORDER),
            ('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),4*mm),
            ('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),
        ]))
        story.append(nb)
    else:
        bio_rows = [[
            Paragraph('MARKER',        st(8, bold=True, color=WHITE)),
            Paragraph('FULL NAME',     st(8, bold=True, color=WHITE)),
            Paragraph('VALUE',         st(8, bold=True, color=WHITE)),
            Paragraph('UNIT',          st(8, bold=True, color=WHITE)),
            Paragraph('UPPER LIMIT',   st(8, bold=True, color=WHITE)),
            Paragraph('STATUS',        st(8, bold=True, color=WHITE)),
            Paragraph('CLINICAL NOTE', st(8, bold=True, color=WHITE)),
        ]]
        bio_style = [
            ('BACKGROUND', (0,0),(-1,0), DARK),
            ('TOPPADDING',    (0,0),(-1,-1), 2.5*mm), ('BOTTOMPADDING',(0,0),(-1,-1),2.5*mm),
            ('LEFTPADDING',   (0,0),(-1,-1), 3*mm),   ('RIGHTPADDING', (0,0),(-1,-1),3*mm),
            ('BOX',    (0,0),(-1,-1), 0.5, BORDER),
            ('INNERGRID',(0,0),(-1,-1), 0.3, BORDER),
            ('VALIGN', (0,0),(-1,-1), 'MIDDLE'),
        ]
        for i, (key, (short, unit, normal, full_name_b, note)) in enumerate(BIOMARKER_INFO.items(), 1):
            raw_val = bio_vals.get(key, '')
            display = raw_val if raw_val not in ('—','') else 'N/A'
            if raw_val not in ('—',''):
                try:
                    fv = float(raw_val)
                    if fv > normal:
                        status, bg = 'ELEVATED ▲', SYM_RED
                    elif fv > normal * 0.85:
                        status, bg = 'BORDERLINE', SYM_AMBER
                    else:
                        status, bg = 'NORMAL ✓',   SYM_GREEN
                except Exception:
                    status, bg = 'ENTERED', GRAY_LT
            else:
                status, bg = 'NOT PROVIDED', GRAY_LT

            bio_rows.append([
                Paragraph(short,              st(9, bold=True)),
                Paragraph(full_name_b,        st(8, color=GRAY)),
                Paragraph(display,            st(9, bold=True)),
                Paragraph(unit,               st(8, color=GRAY)),
                Paragraph(f'< {normal}',      st(8, color=GRAY)),
                Paragraph(status,             st(8, bold=True)),
                Paragraph(note,               st(7.5, color=GRAY, leading=10)),
            ])
            bio_style.append(('BACKGROUND', (0,i),(5,i), bg))

        bio_t = Table(bio_rows, colWidths=[16*mm, 32*mm, 18*mm, 12*mm, 18*mm, 22*mm, 52*mm])
        bio_t.setStyle(TableStyle(bio_style))
        story.append(bio_t)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 7: DIFFERENTIAL DIAGNOSIS ───────────────────────────────────────
    story.append(sec('SECTION 7 — DIFFERENTIAL DIAGNOSIS  (ALL CLASS SCORES)', CW))
    story.append(Spacer(1, 2*mm))

    rclrs = {
        'High':     RISK_COL['High Risk'],
        'Moderate': RISK_COL['Moderate Risk'],
        'Low':      RISK_COL['Low Risk'],
    }
    diff_rows = [[
        Paragraph('CONDITION',      st(8, bold=True, color=WHITE)),
        Paragraph('CODE',           st(8, bold=True, color=WHITE)),
        Paragraph('RISK CLASS',     st(8, bold=True, color=WHITE)),
        Paragraph('AI SCORE',       st(8, bold=True, color=WHITE)),
        Paragraph('CONFIDENCE BAR', st(8, bold=True, color=WHITE)),
    ]]
    diff_style = [
        ('BACKGROUND', (0,0),(-1,0), DARK),
        ('BACKGROUND', (0,1),(-1,1), BLUE_LT),   # top prediction highlight
        ('TOPPADDING',    (0,0),(-1,-1), 3*mm), ('BOTTOMPADDING',(0,0),(-1,-1),3*mm),
        ('LEFTPADDING',   (0,0),(-1,-1), 3.5*mm),('RIGHTPADDING', (0,0),(-1,-1),3.5*mm),
        ('ROWBACKGROUNDS',(0,2),(-1,-1), [WHITE, GRAY_LT]),
        ('BOX',    (0,0),(-1,-1), 0.5, BORDER),
        ('INNERGRID',(0,0),(-1,-1), 0.3, BORDER),
        ('VALIGN', (0,0),(-1,-1), 'MIDDLE'),
    ]
    bar_total = 62*mm
    for cls in sorted(['mel','bcc','akiec','bkl','df','vasc','nv'],
                      key=lambda c: raw_scores.get(c, 0), reverse=True):
        sc     = raw_scores.get(cls, 0)
        pct    = round(sc * 100, 1)
        rt     = CLASS_RISK.get(cls, 'Low')
        rclr   = rclrs.get(rt, GRAY)
        is_top = cls == dlabel
        bar    = Drawing(bar_total, 9)
        bar.add(Rect(0, 0, bar_total, 9, fillColor=BORDER, strokeColor=None))
        bar.add(Rect(0, 0, bar_total * sc, 9,
                     fillColor=rclr if is_top else colors.HexColor('#93c5fd'),
                     strokeColor=None))
        diff_rows.append([
            Paragraph(NAME_MAP.get(cls, cls), st(9, bold=is_top)),
            Paragraph(cls.upper(),            st(8, color=GRAY)),
            Paragraph(rt,                     st(8, bold=True, color=rclr)),
            Paragraph(f'{pct}%',              st(9, bold=True, color=BLUE if is_top else GRAY)),
            bar,
        ])
    diff_t = Table(diff_rows, colWidths=[52*mm, 17*mm, 22*mm, 17*mm, bar_total])
    diff_t.setStyle(TableStyle(diff_style))
    story.append(diff_t)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 8: PERSONALISED RECOMMENDATIONS ─────────────────────────────────
    story.append(sec('SECTION 8 — PERSONALISED CLINICAL RECOMMENDATIONS', CW))
    story.append(Spacer(1, 2*mm))

    recs = RECOMMENDATIONS.get(risk, RECOMMENDATIONS['Low Risk'])
    rec_rows = []
    for i, rec in enumerate(recs, 1):
        rec_rows.append([
            Paragraph(str(i), st(11, bold=True, color=WHITE, align=TA_CENTER)),
            Paragraph(rec,    st(9, leading=15)),
        ])
    rec_t = Table(rec_rows, colWidths=[10*mm, CW - 10*mm])
    rec_style = [
        ('TOPPADDING',    (0,0),(-1,-1), 3*mm), ('BOTTOMPADDING',(0,0),(-1,-1),3*mm),
        ('LEFTPADDING',   (0,0),(0,-1),  0),
        ('LEFTPADDING',   (1,0),(1,-1),  4*mm),
        ('RIGHTPADDING',  (0,0),(-1,-1), 3*mm),
        ('BOX',           (0,0),(-1,-1), 1, rbd),
        ('INNERGRID',     (0,0),(-1,-1), 0.3, rbd),
        ('BACKGROUND',    (1,0),(1,-1),  rbg),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ]
    for i in range(len(recs)):
        rec_style.append(('BACKGROUND', (0,i),(0,i), rcol))
    rec_t.setStyle(TableStyle(rec_style))
    story.append(rec_t)
    story.append(Spacer(1, 3*mm))

    # Personalised context note using patient's own symptom answers
    positive_symptoms = [s for s, v in [
        ('bleeding', bleeding), ('mole change', mole_change),
        ('new growth', new_mole), ('non-healing sore', sore_not_healing),
        ('spreading pigment', spread_pigment),
    ] if v.lower() in ('yes', 'sometimes')]

    if risk == 'High Risk':
        if positive_symptoms:
            sym_str = ', '.join(positive_symptoms)
            extra = (f'<b>Personalised note for {full_name}:</b> Based on your intake responses, '
                     f'you reported the following concerning symptoms: <b>{sym_str}</b>. '
                     f'Combined with this high-risk AI finding ({dname}, {conf:.1f}% confidence), '
                     f'immediate specialist evaluation is strongly advised. '
                     f'Do not postpone your appointment.')
        else:
            extra = (f'<b>Personalised note for {full_name}:</b> Even though no specific symptoms '
                     f'were flagged in your intake form, the AI model has identified this lesion '
                     f'as <b>{dname}</b> with <b>{conf:.1f}% confidence</b>. '
                     f'High-risk findings require professional confirmation regardless of symptoms.')
    elif risk == 'Moderate Risk':
        extra = (f'<b>Personalised note for {full_name}:</b> This lesion has been classified as '
                 f'<b>{dname}</b> ({conf:.1f}% confidence) — a moderate-risk finding. '
                 f'Given your reported UV exposure level of <b>{uv_exposure}</b> and '
                 f'family history status of <b>{family_history}</b>, a scheduled dermatology '
                 f'appointment within the next 2–4 weeks is recommended.')
    else:
        extra = (f'<b>Personalised note for {full_name}:</b> The AI model has classified this '
                 f'as <b>{dname}</b> ({conf:.1f}% confidence) — a low-risk finding. '
                 f'Continue performing monthly self-examinations and annual skin checks. '
                 f'Apply sunscreen daily given your reported UV exposure ({uv_exposure}).')

    pnote = Table([[Paragraph(extra, st(9, leading=14, color=SLATE))]], colWidths=[CW])
    pnote.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), GRAY_LT),('BOX',(0,0),(-1,-1),0.5,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),4*mm),
        ('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),
    ]))
    story.append(pnote)
    story.append(Spacer(1, 4*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── SEC 9: ABCDE SELF-EXAM GUIDE ────────────────────────────────────────
    story.append(sec('SECTION 9 — ABCDE MELANOMA SELF-EXAMINATION GUIDE', CW))
    story.append(Spacer(1, 2*mm))

    abcde = [
        ('A', 'Asymmetry',  'One half of the mole does not match the other half in shape or size.',                   '#3b82f6'),
        ('B', 'Border',     'Edges are irregular, ragged, notched, or blurred rather than smooth.',                   '#8b5cf6'),
        ('C', 'Colour',     'The colour is not uniform — look for shades of brown, black, pink, red, white or blue.', '#6366f1'),
        ('D', 'Diameter',   'The spot is larger than 6 mm across (about the size of a pencil eraser).',               '#06b6d4'),
        ('E', 'Evolving',   'The mole is changing in size, shape, colour, or any new symptom such as bleeding.',      '#10b981'),
    ]
    abcde_cells = []
    for letter, title, desc, hx in abcde:
        col = colors.HexColor(hx)
        cell = Table([
            [Paragraph(letter, st(15, bold=True, color=WHITE, align=TA_CENTER))],
            [Paragraph(title,  st(8,  bold=True, color=col,   align=TA_CENTER))],
            [Paragraph(desc,   st(7.5, color=GRAY, align=TA_CENTER, leading=10))],
        ], colWidths=[CW / 5 - 2*mm])
        cell.setStyle(TableStyle([
            ('BACKGROUND',    (0,0),(-1,0), col),
            ('BACKGROUND',    (0,1),(-1,-1), GRAY_LT),
            ('BOX',           (0,0),(-1,-1), 1, col),
            ('TOPPADDING',    (0,0),(-1,-1), 2.5*mm), ('BOTTOMPADDING',(0,0),(-1,-1),2.5*mm),
            ('LEFTPADDING',   (0,0),(-1,-1), 2*mm),   ('RIGHTPADDING', (0,0),(-1,-1),2*mm),
        ]))
        abcde_cells.append(cell)

    story.append(Table(
        [abcde_cells],
        colWidths=[CW / 5] * 5,
        style=TableStyle([
            ('LEFTPADDING', (0,0),(-1,-1), 1*mm),
            ('RIGHTPADDING',(0,0),(-1,-1), 1*mm),
        ])
    ))
    story.append(Spacer(1, 5*mm))

    # ════════════════════════════════════════════════════════════════════════
    # ── FOOTER ──────────────────────────────────────────────────────────────
    story.append(HRFlowable(width=CW, thickness=0.5, color=BORDER))
    story.append(Spacer(1, 3*mm))
    footer = Table([[
        Paragraph(
            '<b>DermAssist AI</b> · AI-Based Skin Lesion Screening Platform<br/>'
            'This report is generated by an AI model for <b>screening purposes only</b> and does '
            '<b>NOT</b> constitute a medical diagnosis. Always consult a qualified dermatologist '
            'or licensed healthcare professional before making any clinical decisions.',
            st(7.5, color=GRAY, leading=11)
        ),
        Paragraph(
            f'<b>Report ID:</b> {report_id}<br/>'
            f'<b>Generated:</b> {now}<br/>'
            f'<b>Model:</b> DermAssist v2.0 · HAM10000 · 7 Classes',
            st(7.5, color=GRAY, align=TA_RIGHT, leading=11)
        ),
    ]], colWidths=[115*mm, 55*mm])
    footer.setStyle(TableStyle([
        ('VALIGN',        (0,0),(-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0),(-1,-1), 0), ('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',   (0,0),(0,-1),  0), ('RIGHTPADDING', (1,0),(1,-1), 0),
    ]))
    story.append(footer)

    doc.build(story)
    return buf.getvalue()