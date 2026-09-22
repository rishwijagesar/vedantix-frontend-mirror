"""Inspect rendered PDF text/bounds, including overflow and missing-data cases."""
import pathlib
import subprocess
import xml.etree.ElementTree as ET

root = pathlib.Path('tmp/website-report')
for name in ('normal', 'partial', 'long'):
    pdf = root / (name + '.pdf')
    text = subprocess.check_output(['pdftotext', '-layout', str(pdf), '-'], text=True)
    assert 'Website in beeld'.upper() in text, (name, 'cover missing')
    assert 'Agentisch browsen' in text and 'AEO' in text and 'GEO' in text and 'AIO' in text
    assert 'geen volledige Core Web Vitals' in text.replace('\n', ' ')
    assert 'INTERNAL_NOTE_DO_NOT_SHARE' not in text
    if name == 'normal':
        assert 'Mobiel in detail' in text and 'Desktop in detail' in text
        assert '4,5 s' in text and '2,9 s' in text and '100/100' in text
    if name == 'partial':
        assert 'Gedeeltelijke meting' in text and 'Aandacht nodig' in text
        assert 'Niet beschikbaar' in text and 'Desktop in detail' not in text
    if name == 'long':
        assert 'Klantnotitie' in text and 'Controle 38:' in text
        assert '10 van 20 beoordeelde controles geslaagd' in text
    xml = subprocess.check_output(['pdftotext', '-bbox', str(pdf), '-'])
    tree = ET.fromstring(xml)
    for page in tree.iter('{http://www.w3.org/1999/xhtml}page'):
        words = list(page.iter('{http://www.w3.org/1999/xhtml}word'))
        assert words, (name, 'empty page')
        for word in words:
            x1, y1, x2, y2 = (float(word.attrib[k]) for k in ('xMin', 'yMin', 'xMax', 'yMax'))
            assert 44 <= x1 < x2 <= 551, (name, 'horizontal overflow', word.text, x1, x2)
            assert 18 <= y1 < y2 <= 831, (name, 'vertical overflow', word.text, y1, y2)
            assert y1 < 768 or y1 >= 790, (name, 'body collides with footer', word.text, y1)
    print(f'PASS: {name} client PDF text and page bounds')
