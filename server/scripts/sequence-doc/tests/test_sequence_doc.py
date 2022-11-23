'''
Basic sequence doc tests
'''
from src.generate_doc import parse_args, DEFAULT_DOC_VERSION

## Test Command Line Args
def test_command_line_args():
    '''
    '''
    test_version = 'another-version'
    mock_args = ['--version', test_version]

    args = parse_args(mock_args)
    assert args.version == test_version

    default_args = parse_args([])
    assert default_args.version == DEFAULT_DOC_VERSION
