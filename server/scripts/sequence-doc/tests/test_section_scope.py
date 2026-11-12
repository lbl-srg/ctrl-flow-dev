'''
Consistency of the source document and of the mappings of the default version
(docs/sequence-doc.md, "Annotations" and "Sections of System Types")

Validates the content of the source document and of the mappings, not the
mogrifier: the toggles and their extent are found with the helpers of the
mogrifier, but nothing is evaluated. How the values of a payload are gathered
and how toggles are evaluated is tested elsewhere (test_sequence_payload.py,
test_toggles.py, test_golden.py).

Every toggle has a valid format and uses short IDs of the mappings: otherwise
the mogrifier raises an error.

An `AND` reads one system type, and a pattern the templates of one system
type: a toggle is evaluated on one configuration at a time, so an `AND` of two
system types could never be true. A `NONE` operand has the same value on all
configurations, so it reads no system type.

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
import csv
import re
from docx import Document
from docx.text.paragraph import Paragraph
from ctrlflow import keys
from generate_doc import (DEFAULT_DOC_VERSION, MAPPING_FILE_PATH, MAPPINGS_MODELICA_INSTANCE,
                          SOURCE_DOC_PATH, generate_name_map, get_local_path_prefix)
import mogrifier
import toggles

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
UNITS_RE = re.compile(r'\[UNITS \[(.+)] \[(.+)]]')

def load():
    ''' Name map, source document and toggles of the default version '''
    prefix = get_local_path_prefix(DEFAULT_DOC_VERSION)
    name_map = generate_name_map(prefix / MAPPING_FILE_PATH)
    doc = Document(prefix / SOURCE_DOC_PATH)
    mogrifier.initialize_remove_list()
    control_structures, _ = mogrifier.create_control_structures(doc)
    return name_map, doc, control_structures


def system_types():
    ''' System types of the mappings: the entries of `Modelica Parameter` that
        are not keys, without the templates they enclose
    '''
    with open(get_local_path_prefix(DEFAULT_DOC_VERSION) / MAPPING_FILE_PATH) as fh:
        names = {row[MAPPINGS_MODELICA_INSTANCE] for row in csv.DictReader(fh)}
    classes = {name for name in names if name and '-' not in name}
    return {name for name in classes if not any(name.startswith(f'{c}.') for c in classes)}


def parse(op, name_map):
    ''' Tree of a toggle, None for UNITS, which has none. Raises ToggleError
        if the toggle is invalid.
    '''
    if op['op'] != mogrifier.UNITS_SHORT_NAME:
        return toggles.parse(op['text'], name_map)
    if not UNITS_RE.fullmatch(op['text']):
        raise toggles.ToggleError(f"Invalid toggle {op['text']}: invalid format")
    for short_id in (mogrifier.UNITS_SHORT_NAME, 'SI', 'IP'):
        toggles.long_name(short_id, name_map)
    return None


def nodes(toggle):
    ''' A toggle and the toggles nested in it '''
    yield toggle
    for operand in toggle.operands:
        yield from nodes(operand)


def system_type_of(name, types):
    ''' System type of a key or of a system type, None if it has none '''
    root_class = name.partition('-')[0]
    matches = [t for t in types if root_class == t or root_class.startswith(f'{t}.')]
    return matches[0] if matches else None


def read_system_types(toggle, types):
    ''' System types read by a toggle: not by a NONE operand, which has the
        same value on all configurations
    '''
    if toggle.op == 'NONE':
        return set()
    result = {system_type_of(key, types) for key in toggle.keys} - {None}
    for operand in toggle.operands:
        result |= read_system_types(operand, types)
    return result


def mixes_system_types(toggle, types):
    ''' True if an `AND` of the toggle reads two system types '''
    return any(
        node.op == 'AND' and len(read_system_types(node, types)) > 1
        for node in nodes(toggle)
    )


def spans_system_types(pattern, types):
    ''' True if the keys of a pattern are not all of one system type '''
    return len({system_type_of(key, types) for key in keys.expand_pattern(pattern)}) > 1


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


def test_toggles_are_valid():
    name_map, _, control_structures = load()
    errors = []
    for op in control_structures:
        try:
            parse(op, name_map)
        except toggles.ToggleError as error:
            errors.append(str(error))
    assert errors == []


def test_system_types_of_the_mappings():
    assert system_types() == {
        'Buildings.Templates.AirHandlersFans',
        'Buildings.Templates.ZoneEquipment',
    }


def test_and_reads_one_system_type():
    name_map, _, control_structures = load()
    types = system_types()
    errors = []
    for op in control_structures:
        toggle = parse(op, name_map)
        if toggle and mixes_system_types(toggle, types):
            errors.append(op['text'])
    assert errors == []


def test_and_of_two_system_types_is_detected():
    types = {'P.Ahu', 'P.Zone'}
    name_map = {
        'AHU': 'P.Ahu.A-c.p',
        'ZONE': 'P.Zone.B-c.p',
        'ZONE2': 'P.Zone.C-c.p',
        'SETTING': 'P.AllSystems-s',
    }

    def mixes(text):
        return mixes_system_types(toggles.parse(text, name_map), types)

    assert mixes('[AND [YES AHU] [YES ZONE]]')
    assert mixes('[OR [YES SETTING] [AND [YES AHU] [YES ZONE]]]')
    assert mixes('[NONE [AND [YES AHU] [YES ZONE]]]')
    assert mixes('[AND [OR [YES ZONE] [YES AHU]] [YES SETTING]]')
    assert not mixes('[AND [YES ZONE] [YES ZONE2]]')
    assert not mixes('[AND [YES ZONE] [YES SETTING]]')
    assert not mixes('[OR [YES AHU] [YES ZONE]]')
    assert not mixes('[AND [YES AHU] [NONE [YES ZONE]]]')


def test_patterns_read_one_system_type():
    name_map, _, _ = load()
    types = system_types()
    errors = [
        name for name in name_map.values()
        if keys.is_pattern(name) and spans_system_types(name, types)
    ]
    assert errors == []


def test_pattern_of_two_system_types_is_detected():
    types = {'P.Ahu', 'P.Zone'}
    assert spans_system_types('P.{Ahu.A|Zone.B}-c.p', types)
    assert spans_system_types('P.{Zone.B|AllSystems}-c.p', types)
    assert not spans_system_types('P.Zone.{A|B}-c.p', types)


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
