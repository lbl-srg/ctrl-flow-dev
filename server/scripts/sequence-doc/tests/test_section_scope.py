'''
Consistency of the source document and of the mappings of the default version
(docs/sequence-doc.md, "Annotations" and "Sections of System Types")

Validates the content of the source document and of the mappings, not the
mogrifier: the toggles and their extent are found with the helpers of the
mogrifier, but nothing is evaluated. How the values of a payload are gathered
and how toggles are evaluated is tested elsewhere (test_sequence_payload.py,
test_mogrifier*.py, test_golden.py).

Every toggle has a valid format and uses short IDs of the mappings: otherwise
the mogrifier only logs an error and deletes the section.

Every heading is numbered by a list, so that Word renumbers the headings that
follow a removed section (see "Heading Numbering").

A section toggled by templates of a system type, e.g. `[EQUALS VAV RH]` or
`[ANY VAV PFBCV SFBCV]`, reads the values of these templates only: a key of
another template of the same system type would let a configuration of that
template keep or delete the section. Keys of other system types and of the
project are not restricted, e.g. a section of the AHU reads the CO2 sensors of
all zones.

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

# Templates with a section in the source document of each version: the
# sections of all of them must be found
SECTIONS = {
    'Current G36 Decisions': {
        'Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly',
        'Buildings.Templates.ZoneEquipment.VAVBoxReheat',
        'Buildings.Templates.AirHandlersFans.VAVMultiZone',
    },
    'DOD_20260828': {
        'Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly',
        'Buildings.Templates.ZoneEquipment.VAVBoxReheat',
        'Buildings.Templates.ZoneEquipment.VAVBoxFanParallelConstant',
        'Buildings.Templates.ZoneEquipment.VAVBoxFanSeriesConstant',
    },
}

SYSTEM_TYPE_RE = re.compile(r'\[(?:EQUALS|ANY) (\w+)((?: \w+)+)\]')
NESTED_RE = re.compile(r'\[(AND|OR) \[(.+)] \[(.+)]]')
UNITS_RE = re.compile(r'\[UNITS \[(.+)] \[(.+)]]')
# Operation: (minimum, maximum) number of short IDs, None if unbounded
OPERANDS = {
    'YES': (1, 1),
    'NO': (1, 1),
    'EQUALS': (2, 2),
    'NOT_EQUALS': (2, 2),
    'ANY': (2, None),
    'DELETE': (0, 0),
}


def load():
    ''' Name map, source document and toggles of the default version '''
    prefix = get_local_path_prefix(DEFAULT_DOC_VERSION)
    name_map = generate_name_map(prefix / MAPPING_FILE_PATH)
    doc = Document(prefix / SOURCE_DOC_PATH)
    mogrifier.initialize_remove_list()
    control_structures, _ = mogrifier.create_control_structures(doc)
    return name_map, doc, control_structures


def short_ids(text):
    ''' Short IDs of a toggle, split as the mogrifier does: AND and OR into
        their two nested toggles, TABLE, ROW and COLUMN into the toggle that
        follows. Raises ValueError if the format is invalid.
    '''
    tokens = [token for token in re.split(r'\W+', text) if token]
    op = tokens[0] if tokens else ''
    if op in mogrifier.TABLE_OP_LIST:
        return short_ids(text.replace(f'{op} ', '', 1))
    if op == 'UNITS':
        if not UNITS_RE.fullmatch(text):
            raise ValueError('invalid format')
        return ['UNITS', 'SI', 'IP']
    if op in ('AND', 'OR'):
        match = NESTED_RE.fullmatch(text)
        if not match:
            raise ValueError('invalid format')
        return short_ids(f'[{match.group(2)}]') + short_ids(f'[{match.group(3)}]')
    if op not in OPERANDS:
        raise ValueError(f'unknown operation {op!r}')
    minimum, maximum = OPERANDS[op]
    count = len(tokens) - 1
    if count < minimum or (maximum is not None and count > maximum):
        raise ValueError(f'{count} short IDs for {op}')
    return tokens[1:]


def system_type_templates(text, name_map):
    ''' (system type, templates) of a section toggled by templates of a system
        type, e.g. `[ANY VAV PFBCV SFBCV]`: (`Buildings.Templates.ZoneEquipment`,
        {`Buildings.Templates.ZoneEquipment.VAVBoxFanParallelConstant`,
        `Buildings.Templates.ZoneEquipment.VAVBoxFanSeriesConstant`}), else None
    '''
    match = SYSTEM_TYPE_RE.fullmatch(text)
    if not match:
        return None
    system_type = name_map.get(match.group(1), '')
    templates = {name_map.get(short_id, '') for short_id in match.group(2).split()}
    if system_type and all(t.startswith(f'{system_type}.') for t in templates):
        return system_type, templates
    return None


def read_keys(text, name_map):
    ''' Keys read by a toggle, patterns expanded '''
    result = []
    for token in re.split(r'\W+', text):
        long_name = name_map.get(token, '')
        if '-' in long_name:
            result += keys.expand_pattern(long_name)
    return result


def test_toggles_use_short_ids_of_the_mappings():
    name_map, _, control_structures = load()
    errors = []
    for op in control_structures:
        try:
            missing = [s for s in short_ids(op['text']) if s not in name_map]
        except ValueError as error:
            errors.append(f"{op['text']}: {error}")
            continue
        if missing:
            errors.append(f"{op['text']}: {', '.join(missing)} not in the mappings")
    assert errors == []


def list_id(paragraph):
    ''' ID of the list numbering a paragraph: set on the paragraph, else on its
        style or the styles it is based on. None or 0 if not numbered.
    '''
    ppr = paragraph._p.pPr
    if ppr is not None and ppr.numPr is not None and ppr.numPr.numId is not None:
        return ppr.numPr.numId.val
    style = paragraph.style
    while style is not None:
        ppr = style.element.pPr
        if ppr is not None and ppr.numPr is not None and ppr.numPr.numId is not None:
            return ppr.numPr.numId.val
        style = style.base_style
    return None


def test_headings_are_numbered_by_a_list():
    _, doc, _ = load()
    errors = []
    for p in doc.element.body.iter(mogrifier.P_TAG):
        paragraph = Paragraph(p, doc)
        if mogrifier.get_heading_level(paragraph) < 100 and not list_id(paragraph):
            errors.append(f'{paragraph.style.name}: {paragraph.text}')
    assert errors == []


def test_system_type_sections_read_their_templates_only():
    name_map, doc, control_structures = load()
    toggles = {}
    for op in control_structures:
        toggles.setdefault(op['paragraph']._p, []).append(op['text'])

    sections = []  # (heading level, system type, templates), outermost first
    checked = set()
    errors = []
    for p in doc.element.body.iter(mogrifier.P_TAG):
        paragraph = Paragraph(p, doc)
        level = mogrifier.get_heading_level(paragraph)
        texts = toggles.get(p, [])
        if level < 100:
            sections = [s for s in sections if s[0] < level]
            scope = system_type_templates(texts[0], name_map) if texts else None
            if scope:
                sections.append((level, *scope))
                checked |= scope[1]
        for text in texts:
            for key in read_keys(text, name_map):
                root_class, _ = keys.parse_key(key)
                for _, system_type, templates in sections:
                    if root_class.startswith(f'{system_type}.') and root_class not in templates:
                        errors.append(
                            f'{text} in the section of {", ".join(sorted(templates))} reads {key}')
    assert errors == []
    assert SECTIONS[DEFAULT_DOC_VERSION] <= checked
