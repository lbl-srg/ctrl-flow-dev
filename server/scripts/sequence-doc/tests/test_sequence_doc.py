'''
Basic sequence doc tests
'''
from generate_doc import parse_args, extract_input, DEFAULT_DOC_VERSION, generate_doc, generate_name_map
from docx import Document

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
        assert doc


def test_name_map_generation():
    test_mappings = {'SHORTNAME': 'LONGNAME', 'SHORTNAME1': 'VALUENAME'}

    mappings = generate_name_map("tests/static/example_mappings.csv")
    assert mappings == test_mappings