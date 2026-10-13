'''
Keys read in the section of a system type (docs/sequence-doc.md, "Sections of
System Types")

Validates the content of the source document and of the mappings, not the
mogrifier: the toggles and their extent are found with the helpers of the
mogrifier, but nothing is evaluated. How the values of a payload are gathered
and how toggles are evaluated is tested elsewhere (test_sequence_payload.py,
test_mogrifier*.py, test_golden.py).

A section toggled by a system type, e.g. `[EQUALS VAV RH]`, reads the values
of the template of that system type only: a key of another template of the
same system type would let a configuration of that template keep or delete
the section. Keys of other system types and of the project are not
restricted, e.g. a section of the AHU reads the CO2 sensors of all zones.

Only sections toggled on a heading are checked (a toggle on another paragraph
does not scope the paragraphs that follow it, see "Scope of an Annotation"),
and only those of the system types with a template.
'''
import re
from docx import Document
from docx.text.paragraph import Paragraph
from ctrlflow import keys
from generate_doc import (DEFAULT_DOC_VERSION, MAPPING_FILE_PATH, SOURCE_DOC_PATH,
                          generate_name_map, get_local_path_prefix)
import mogrifier

SYSTEM_TYPE_RE = re.compile(r'\[EQUALS (\w+) (\w+)\]')


def system_type_template(text, name_map):
    ''' (system type, template) of a section toggled by a system type, e.g.
        `[EQUALS VAV RH]`: (`Buildings.Templates.ZoneEquipment`,
        `Buildings.Templates.ZoneEquipment.VAVBoxReheat`), else None
    '''
    match = SYSTEM_TYPE_RE.match(text)
    if not match:
        return None
    system_type = name_map.get(match.group(1), '')
    template = name_map.get(match.group(2), '')
    if system_type and template.startswith(f'{system_type}.'):
        return system_type, template
    return None


def read_keys(text, name_map):
    ''' Keys read by a toggle, patterns expanded '''
    result = []
    for token in re.split(r'\W+', text):
        long_name = name_map.get(token, '')
        if '-' in long_name:
            result += keys.expand_pattern(long_name)
    return result


def test_system_type_sections_read_their_template_only():
    prefix = get_local_path_prefix(DEFAULT_DOC_VERSION)
    name_map = generate_name_map(prefix / MAPPING_FILE_PATH)
    doc = Document(prefix / SOURCE_DOC_PATH)
    mogrifier.initialize_remove_list()
    control_structures, _ = mogrifier.create_control_structures(doc)
    toggles = {}
    for op in control_structures:
        toggles.setdefault(op['paragraph']._p, []).append(op['text'])

    sections = []  # (heading level, system type, template), outermost first
    checked = set()
    errors = []
    for p in doc.element.body.iter(mogrifier.P_TAG):
        paragraph = Paragraph(p, doc)
        level = mogrifier.get_heading_level(paragraph)
        texts = toggles.get(p, [])
        if level < 100:
            sections = [s for s in sections if s[0] < level]
            scope = system_type_template(texts[0], name_map) if texts else None
            if scope:
                sections.append((level, *scope))
                checked.add(scope[1])
        for text in texts:
            for key in read_keys(text, name_map):
                root_class, _ = keys.parse_key(key)
                for _, system_type, template in sections:
                    if root_class.startswith(f'{system_type}.') and root_class != template:
                        errors.append(f'{text} in the section of {template} reads {key}')
    assert errors == []
    # The sections of the implemented system types are found
    assert {'Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly',
            'Buildings.Templates.ZoneEquipment.VAVBoxReheat',
            'Buildings.Templates.AirHandlersFans.VAVMultiZone'} <= checked
