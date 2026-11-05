'''
Basic sequence doc tests
'''
from generate_doc import parse_args, extract_input, DEFAULT_DOC_VERSION, generate_doc, generate_name_map
from docx import Document
# from lmxl import etree

## Test Command Line Args
def test_command_line_args():
    ''' Tests that the --version flag updates things as expected
    '''
    test_version = 'another-version'
    test_path = 'my-bespoke-path'
    mock_args = ['--version', test_version, '--output', test_path]

    args = parse_args(mock_args)
    assert args.version == test_version
    assert args.output == test_path

    default_args = parse_args([])
    assert default_args.version == DEFAULT_DOC_VERSION

def test_input_extraction():
    ''' Uses a file as an example IO stream
    '''
    with open("tests/static/example_selections.txt") as f:
        selections = extract_input(f)
        assert selections != None

def test_document_generation():
    ''' Just checks that nothing throws when creating the document
    '''

    with open("tests/static/golden/mixed--ahu-co-rh.payload.json") as f:
        selections = extract_input(f)
        version = DEFAULT_DOC_VERSION

        doc = generate_doc(selections, version)
        # TODO: a more robust check could be implemented to by using lxml's XMLSchema validation
        # I was unable to figure out how to load all the required xsd files (xml schema definitions)
        # for the docx format. python-docx keeps a copy of these xsd files here:
        # https://github.com/python-openxml/python-docx/tree/master/ref/xsd
        # If we can load all of these xsd files (without error) the 'validate' call
        # will be able to return a boolean if the generated doc is a valid docx

        # xmlschema_doc = etree.parse("tests/static/wml.xsd")
        # xmlschema = etree.XMLSchema(xmlschema_doc)

        # assert xmlschema.validate(doc)
        assert doc


def mixed_project(ventilation, sensors):
    ''' Payload of an AHU and two zones with the given ventilation standard
        and `(have_CO2Sen, have_occSen, have_winSen)` of each zone
    '''
    with open("tests/static/golden/mixed--ahu-co-rh.payload.json") as f:
        payload = extract_input(f)
    project = payload['projects'][0]
    project['values']['Buildings.Templates.Data.AllSystems-stdVen']['value'] = ventilation
    zones = [c for c in project['configurations'] if c['systemType'] == 'Buildings.Templates.ZoneEquipment']
    assert len(zones) == len(sensors)
    for configuration, values in zip(zones, sensors):
        for parameter, value in zip(('have_CO2Sen', 'have_occSen', 'have_winSen'), values):
            configuration['values'][f"{configuration['template']}-ctl.{parameter}"]['value'] = value
    return payload


def document_paragraphs(payload):
    return [paragraph.text for paragraph in generate_doc(payload, DEFAULT_DOC_VERSION).paragraphs]


def has_paragraph(paragraphs, start):
    return any(paragraph.startswith(start) for paragraph in paragraphs)


TITLE_24 = 'Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24'
ASHRAE_62_1 = 'Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.ASHRAE62_1'
MIN_OA_RESET = 'The minimum outdoor air setpoint MinOAsp shall be reset based on the highest zone CO2'
MIN_OA_EQUAL = 'The minimum outdoor air setpoint MinOAsp shall be equal to DesMinOA*'
ZONE_NO_SENSOR = 'Zone-Abs-OA-min shall be equal to Zone-Des-OA-min.'
NO_WINDOW_SWITCH = 'If the zone is in any mode other than Occupied Mode: Vbz-P*'


def test_ahu_section_of_a_project_with_mixed_zones():
    ''' `[NONE [YES CO2]]`: the zone with a CO2 sensor removes the section,
        and the zone without one does not keep it
    '''
    paragraphs = document_paragraphs(mixed_project(TITLE_24, [(True, False, False), (False, False, False)]))
    assert has_paragraph(paragraphs, MIN_OA_RESET)
    assert not has_paragraph(paragraphs, MIN_OA_EQUAL)


def test_ahu_section_of_a_project_without_co2_sensors():
    paragraphs = document_paragraphs(mixed_project(TITLE_24, [(False, False, False), (False, False, False)]))
    assert not has_paragraph(paragraphs, MIN_OA_RESET)
    assert has_paragraph(paragraphs, MIN_OA_EQUAL)


def test_zone_section_is_kept_by_one_zone():
    ''' `[AND [AND [NO WIN] [NO OCC]] [NO CO2]]` needs one zone without sensors '''
    assert has_paragraph(
        document_paragraphs(mixed_project(TITLE_24, [(True, False, False), (False, False, False)])),
        ZONE_NO_SENSOR)
    assert not has_paragraph(
        document_paragraphs(mixed_project(TITLE_24, [(True, False, False), (False, True, False)])),
        ZONE_NO_SENSOR)


def test_zones_with_only_a_co2_sensor_keep_the_section_without_window_switch():
    ''' `[AND [OR [YES OCC] [YES CO2]] [NO WIN]]` '''
    paragraphs = document_paragraphs(mixed_project(ASHRAE_62_1, [(True, False, False), (True, False, False)]))
    assert has_paragraph(paragraphs, NO_WINDOW_SWITCH)


def test_section_without_window_switch_needs_a_sensor_on_the_same_zone():
    ''' The heading is kept by the first zone, and no zone has a sensor and no
        window switch
    '''
    paragraphs = document_paragraphs(mixed_project(ASHRAE_62_1, [(False, False, True), (False, False, False)]))
    assert not has_paragraph(paragraphs, NO_WINDOW_SWITCH)


def test_name_map_generation():
    test_mappings = {'SHORTNAME': 'LONGNAME', 'SHORTNAME1': 'VALUENAME'}

    mappings = generate_name_map("tests/static/example_mappings.csv")
    assert mappings == test_mappings