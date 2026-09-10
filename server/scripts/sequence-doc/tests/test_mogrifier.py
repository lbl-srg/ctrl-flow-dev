'''
Regression tests for issue #619:
`[ANY ...]` toggle dropped its section when the resolved selection list had
more than one entry and a non-matching entry was iterated before a matching one,
because `common_member` was handed a one-shot `map` iterator.
'''
import utils
from mogrifier import evaluate_annotation


def test_common_member_accepts_one_shot_iterable():
    ''' A `map`/generator must be usable even when the first few probes miss.
    '''
    haystack = map(str.upper, ['other', 'match'])
    assert utils.common_member(['NOPE', 'MATCH'], haystack) == ['MATCH']


def test_any_toggle_kept_when_match_is_not_first_selection():
    ''' [ANY ...] keeps the section (returns False) when any compare value is
        selected, regardless of ordering / list length.
    '''
    name_map = {
        'buiPreCon': 'path.buiPreCon',
        'ReturnFanMeasuredAir': 'ReturnFanMeasuredAir',
        'ReturnFanCalculatedAir': 'ReturnFanCalculatedAir',
    }
    selections = {
        # non-matching entry first, matching entry second
        'path.buiPreCon': ['ReliefFan', 'ReturnFanCalculatedAir'],
    }
    op = {
        'op': 'ANY',
        'text': '[ANY buiPreCon ReturnFanMeasuredAir ReturnFanCalculatedAir]',
    }

    assert evaluate_annotation(op, name_map, selections) is False


def test_any_toggle_deleted_when_no_compare_value_selected():
    ''' [ANY ...] still deletes (returns True) when nothing matches.
    '''
    name_map = {
        'buiPreCon': 'path.buiPreCon',
        'ReturnFanMeasuredAir': 'ReturnFanMeasuredAir',
        'ReturnFanCalculatedAir': 'ReturnFanCalculatedAir',
    }
    selections = {'path.buiPreCon': ['ReliefFan', 'ReliefDamper']}
    op = {
        'op': 'ANY',
        'text': '[ANY buiPreCon ReturnFanMeasuredAir ReturnFanCalculatedAir]',
    }

    assert evaluate_annotation(op, name_map, selections) is True
