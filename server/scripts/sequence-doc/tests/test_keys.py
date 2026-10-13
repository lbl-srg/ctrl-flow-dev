'''
Name scanner, selection keys and key patterns (docs/selection-keys.md)
'''
import pytest
from names import is_class_name, is_name, split_name
from keys import expand_pattern, is_pattern, parse_key
from mogrifier import aggregate_patterns


def test_split_name_keeps_quoted_identifiers():
    assert split_name('a.b.c') == ['a', 'b', 'c']
    assert split_name("P.'c-d'.'a.b'.e") == ['P', "'c-d'", "'a.b'", 'e']
    # Escaped quote and escaped backslash before the closing quote
    assert split_name("'13\\'H.x'.y") == ["'13\\'H.x'", 'y']
    assert split_name("'a\\\\'.b") == ["'a\\\\'", 'b']
    with pytest.raises(ValueError, match='Unclosed quoted identifier'):
        split_name("a.'b")


def test_names():
    for name in ['a', '.Modelica.Units', "P.'with-dash'", "'13\\'H'", "'a \"b\" ?'"]:
        assert is_name(name)
    for name in ['', '1a', 'a.', 'a..b', 'a-b', "''", "'a\\x'", 'a[1]']:
        assert not is_name(name)
    assert is_class_name('P.A')
    for name in ['.P.A', "P.'A'", 'P.A-b', '{A|B}']:
        assert not is_class_name(name)


def test_parse_key():
    assert parse_key("P.T-'c-d'.'a.b'") == ('P.T', "'c-d'.'a.b'")
    assert parse_key('Buildings.Templates.Data.AllSystems-stdEne') == (
        'Buildings.Templates.Data.AllSystems', 'stdEne')
    for key in ['P.T', '-a', 'P.T-', "P.'T'-a", "P.T-a.'b", 'P.T-a[1]', 'P.T-.a']:
        with pytest.raises(ValueError, match='Invalid selection key'):
            parse_key(key)


def test_expand_pattern():
    assert expand_pattern('P.A-c.p') == ['P.A-c.p']
    assert expand_pattern('P.{A|B}-c.p') == ['P.A-c.p', 'P.B-c.p']
    assert expand_pattern('{P.A|Q.B}-c.p') == ['P.A-c.p', 'Q.B-c.p']
    assert expand_pattern("P.{A|B}-'c-d'.p") == ["P.A-'c-d'.p", "P.B-'c-d'.p"]
    for pattern in ['P.{A|B}', 'P.{A|}-c', 'P.{A|B}.C-c', "P.{A|'B'}-c"]:
        with pytest.raises(ValueError):
            expand_pattern(pattern)


def test_is_pattern():
    assert is_pattern('P.{A|B}-c.p')
    assert is_pattern('Buildings.Templates.Data.AllSystems-stdEne')
    # Names that are not keys: system type, enumeration literals
    assert not is_pattern('Buildings.Templates.AirHandlersFans')
    assert not is_pattern("P.Types.Valve.'two-way'")
    assert not is_pattern('DEL_INFO_BOX')


def test_aggregate_patterns_gives_the_union_of_the_values():
    name_map = {
        'OCC': 'P.{A|B}-ctl.have_occSen',
        'CO2': 'P.{A|B}-ctl.have_CO2Sen',
        'UNITS': 'P.AllSystems-sysUni',
        'AHU': 'P.AirHandlers',
    }
    selections = {
        'P.A-ctl.have_occSen': [True],
        'P.B-ctl.have_occSen': [False, True],
        'P.AllSystems-sysUni': ['P.Units.SI'],
        'P.AirHandlers': ['P.AirHandlers.VAV'],
    }
    aggregated = aggregate_patterns(name_map, selections)
    assert aggregated == {
        **selections,
        'P.{A|B}-ctl.have_occSen': [True, False],
    }
    # The selections are not modified, and a pattern without any value is absent
    assert 'P.{A|B}-ctl.have_occSen' not in selections
    assert 'P.{A|B}-ctl.have_CO2Sen' not in aggregated
