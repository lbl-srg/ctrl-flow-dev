'''
Basic sequence doc tests
'''
from generate_doc import parse_args, DEFAULT_DOC_VERSION

## Test Command Line Args
def test_version_args(mocker):
    '''
    '''
    test_version = 'another-version'

    mocker.patch(
    'sys.argv',
        [
            '--version {0}'.format(test_version),
        ],
    )

    args = parse_args()
    assert args.version == test_version
