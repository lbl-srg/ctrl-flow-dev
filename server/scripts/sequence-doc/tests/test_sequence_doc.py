'''
Basic sequence doc tests
'''
from src.generate_doc import parse_args, extract_input, DEFAULT_DOC_VERSION

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

def test_piped_input():
    ''' Uses a file as an example IO stream
    '''
    with open("tests/static/example_selections.txt") as f:
        selections = extract_input(f)
        assert selections != None
