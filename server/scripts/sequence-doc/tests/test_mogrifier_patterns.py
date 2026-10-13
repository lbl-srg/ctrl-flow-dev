'''
Key patterns of the mappings (docs/selection-keys.md, "Mappings")
'''
from mogrifier import aggregate_patterns


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
