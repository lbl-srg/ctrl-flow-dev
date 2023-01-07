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

    with open("tests/static/real_selections.txt") as f:
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


def test_name_map_generation():
    test_mappings = {'SHORTNAME': 'LONGNAME', 'SHORTNAME1': 'VALUENAME'}

    mappings = generate_name_map("tests/static/example_mappings.csv")
    assert mappings == test_mappings