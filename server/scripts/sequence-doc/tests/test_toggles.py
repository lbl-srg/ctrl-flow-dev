'''
Parsing and evaluation of the toggles (docs/sequence-doc.md, "Annotations")
'''
import pytest
import toggles

ZONE = 'P.Zone'
AHU = 'P.Ahu'
NAME_MAP = {
    'VAV': ZONE,
    'AHU': AHU,
    'CO': f'{ZONE}.CoolingOnly',
    'RH': f'{ZONE}.Reheat',
    'DD': f'{ZONE}.DualDuct',
    'MZVAV': f'{AHU}.MultiZone',
    'NOT_IMPLEMENTED': '',
    'CO2': f'{ZONE}.{{CoolingOnly|Reheat}}-ctl.have_CO2Sen',
    'OCC': f'{ZONE}.{{CoolingOnly|Reheat}}-ctl.have_occSen',
    'WIN': f'{ZONE}.{{CoolingOnly|Reheat}}-ctl.have_winSen',
    'TYP': f'{ZONE}.{{CoolingOnly|Reheat}}-coiHea.typ',
    'HW': 'P.Types.Hot',
    'ELEC': 'P.Types.Electric',
    'GAS': 'P.Types.Gas',
    'VENT': 'P.AllSystems-stdVen',
    'VT24': 'P.Types.Title24',
    '621': 'P.Types.Ashrae',
}


def zone(template='Reheat', co2=False, occ=False, win=False, **values):
    ''' Values of a configuration of a zone '''
    root = f'{ZONE}.{template}'
    return {
        ZONE: root,
        f'{root}-ctl.have_CO2Sen': co2,
        f'{root}-ctl.have_occSen': occ,
        f'{root}-ctl.have_winSen': win,
        **{f'{root}-{key}': value for key, value in values.items()},
    }


def ahu():
    ''' Values of a configuration of an air handler, which has no zone key '''
    return {AHU: f'{AHU}.MultiZone', f'{AHU}.MultiZone-ctl.have_CO2Sen': False}


def keeps(text, configurations):
    return toggles.keeps(toggles.parse(text, NAME_MAP), configurations)


def typ(short_id):
    ''' Arguments of a zone with a heating coil of a given type '''
    return {'coiHea.typ': NAME_MAP[short_id]}


# Parsing

@pytest.mark.parametrize('text', [
    '[YES CO2]',
    '[NO CO2]',
    '[EQUALS VAV RH]',
    '[NOT_EQUALS VAV RH]',
    '[ANY VAV CO RH]',
    '[DELETE]',
    '[AND [YES CO2] [YES OCC]]',
    '[OR [YES CO2] [YES OCC]]',
    '[NONE [YES CO2]]',
    '[TABLE YES CO2]',
    '[ROW NO CO2]',
    '[ROW [EQUALS VAV RH]]',
    '[COLUMN AND [YES CO2] [YES OCC]]',
    # A nested toggle is parsed as the first and as the second operand
    '[AND [OR [YES CO2] [YES OCC]] [YES WIN]]',
    '[AND [YES WIN] [OR [YES CO2] [YES OCC]]]',
    '[OR [YES WIN] [NONE [AND [YES CO2] [OR [YES OCC] [YES WIN]]]]]',
    # White space is not significant
    '  [AND  [YES CO2]\t[YES OCC] ]  ',
    '[AND [YES CO2][YES OCC]]',
])
def test_parses_valid_toggles(text):
    assert toggles.parse(text, NAME_MAP)


@pytest.mark.parametrize('text', [
    '',
    'YES CO2',
    '[]',
    '[YES CO2',
    '[YES CO2]]',
    '[YES CO2] text',
    '[YES CO2][YES OCC]',
    '[YESS CO2]',
    '[UNITS [1 Pa] [2 in.]]',
    '[YES]',
    '[YES CO2 OCC]',
    '[NO CO2 OCC]',
    '[NO [YES CO2]]',
    '[EQUALS VAV]',
    '[EQUALS VAV RH CO]',
    '[NOT_EQUALS VAV]',
    '[ANY VAV]',
    '[DELETE CO2]',
    '[AND [YES CO2]]',
    '[AND [YES CO2] [YES OCC] [YES WIN]]',
    '[AND CO2 OCC]',
    '[OR [YES CO2]]',
    '[NONE]',
    '[NONE CO2]',
    '[NONE [YES CO2] [YES OCC]]',
    # A table toggle is only allowed at the top level
    '[AND [TABLE YES CO2] [YES OCC]]',
    '[TABLE]',
    '[TABLE TABLE YES CO2]',
    '[TABLE [YES CO2] [YES OCC]]',
    '[[YES CO2]]',
])
def test_rejects_invalid_toggles(text):
    with pytest.raises(toggles.ToggleError, match='Invalid toggle'):
        toggles.parse(text, NAME_MAP)


@pytest.mark.parametrize('text', [
    '[YES UNKNOWN]',
    '[NO UNKNOWN]',
    '[EQUALS UNKNOWN RH]',
    '[EQUALS VAV UNKNOWN]',
    '[NOT_EQUALS UNKNOWN RH]',
    '[NOT_EQUALS VAV UNKNOWN]',
    '[ANY VAV RH UNKNOWN]',
    '[AND [YES CO2] [YES UNKNOWN]]',
    '[OR [YES CO2] [YES UNKNOWN]]',
    '[NONE [YES UNKNOWN]]',
    '[ROW YES UNKNOWN]',
])
def test_rejects_unknown_short_ids(text):
    with pytest.raises(toggles.ToggleError, match='UNKNOWN not in the mappings'):
        toggles.parse(text, NAME_MAP)


def test_invalid_toggle_inside_none_is_not_negated():
    with pytest.raises(toggles.ToggleError):
        toggles.parse('[NONE [YES CO2 OCC]]', NAME_MAP)


def test_table_toggle_gives_the_toggle_that_follows():
    assert toggles.parse('[ROW YES CO2]', NAME_MAP) == toggles.parse('[YES CO2]', NAME_MAP)
    assert toggles.parse('[ROW [YES CO2]]', NAME_MAP) == toggles.parse('[YES CO2]', NAME_MAP)


# Leaves, on configurations that differ

MIXED = [zone('CoolingOnly', co2=True, **typ('HW')), zone('Reheat', co2=False, **typ('ELEC'))]


@pytest.mark.parametrize('text, kept', [
    ('[YES CO2]', True),
    ('[NO CO2]', True),
    ('[EQUALS TYP HW]', True),
    ('[EQUALS TYP GAS]', False),
    ('[NOT_EQUALS TYP HW]', True),
    ('[ANY TYP GAS HW]', True),
    ('[ANY TYP GAS]', False),
    # A system type holds the template of the configuration
    ('[EQUALS VAV RH]', True),
    ('[EQUALS VAV DD]', False),
    ('[NOT_EQUALS VAV RH]', True),
    ('[ANY VAV DD CO]', True),
    ('[DELETE]', False),
])
def test_leaf_is_kept_if_a_configuration_satisfies_it(text, kept):
    assert keeps(text, MIXED) is kept
    assert keeps(text, MIXED[::-1]) is kept


@pytest.mark.parametrize('text, values, kept', [
    ('[YES CO2]', [False, False], False),
    ('[YES CO2]', [True, True], True),
    ('[NO CO2]', [False, False], True),
    ('[NO CO2]', [True, True], False),
    ('[NO CO2]', [True, False], True),
    ('[NONE [YES CO2]]', [False, False], True),
    ('[NONE [YES CO2]]', [True, True], False),
    ('[NONE [YES CO2]]', [True, False], False),
])
def test_no_and_none_on_zones(text, values, kept):
    assert keeps(text, [zone(co2=value) for value in values]) is kept


def test_not_equals_with_all_configurations_equal():
    assert not keeps('[NOT_EQUALS TYP HW]', [zone(**typ('HW')), zone(**typ('HW'))])
    assert keeps('[NOT_EQUALS TYP HW]', [zone(**typ('HW')), zone(**typ('GAS'))])


def test_pattern_reads_the_key_of_the_template_of_the_configuration():
    assert keeps('[YES CO2]', [zone('CoolingOnly', co2=True)])
    assert keeps('[YES CO2]', [zone('Reheat', co2=True)])


def test_any_does_not_depend_on_the_order_of_the_configurations():
    ''' #619: `[ANY ...]` dropped its section if a configuration that does not
        match came first
    '''
    configurations = [zone(**typ('GAS')), zone(**typ('ELEC'))]
    assert keeps('[ANY TYP HW ELEC]', configurations)
    assert keeps('[ANY TYP HW ELEC]', configurations[::-1])


# Absent keys

@pytest.mark.parametrize('text', [
    '[YES CO2]',
    '[NO CO2]',
    '[EQUALS TYP HW]',
    '[NOT_EQUALS TYP HW]',
    '[ANY TYP HW GAS]',
    '[EQUALS VAV RH]',
    '[NOT_EQUALS VAV RH]',
])
def test_absent_key_satisfies_no_leaf(text):
    assert not keeps(text, [ahu()])


def test_project_without_the_system_type_satisfies_none():
    assert keeps('[NONE [YES CO2]]', [ahu()])
    assert keeps('[NONE [ANY VAV DD]]', [ahu()])


def test_short_id_without_a_mapping_is_never_equal():
    assert not keeps('[EQUALS VAV NOT_IMPLEMENTED]', [zone()])
    assert keeps('[NONE [ANY VAV NOT_IMPLEMENTED]]', [zone()])


# AND and OR

def test_and_is_true_on_one_configuration_only():
    configurations = [zone(co2=True), zone(occ=True)]
    assert not keeps('[AND [YES CO2] [YES OCC]]', configurations)
    assert keeps('[AND [YES CO2] [YES OCC]]', configurations + [zone(co2=True, occ=True)])


def test_or_is_true_on_any_configuration():
    assert keeps('[OR [YES CO2] [YES OCC]]', [zone(co2=True), zone()])
    assert keeps('[OR [YES CO2] [YES OCC]]', [zone(), zone(occ=True)])
    assert not keeps('[OR [YES CO2] [YES OCC]]', [zone(), zone()])


def test_or_of_two_system_types():
    toggle = '[OR [EQUALS VAV RH] [EQUALS AHU MZVAV]]'
    assert keeps(toggle, [ahu()])
    assert keeps(toggle, [zone()])
    assert not keeps(toggle, [zone('CoolingOnly')])


def test_and_states_that_a_section_needs_the_same_configuration_as_its_heading():
    toggle = '[AND [OR [YES OCC] [YES CO2]] [NO WIN]]'
    assert keeps(toggle, [zone(co2=True)])
    assert keeps(toggle, [zone(occ=True)])
    # No zone has a sensor and no window switch
    assert not keeps(toggle, [zone(win=True), zone()])
    assert not keeps(toggle, [zone(win=True, occ=True), zone()])


# NONE

def test_none_differs_from_no_on_mixed_zones():
    configurations = [zone(co2=True), zone(co2=False), ahu()]
    assert keeps('[NO CO2]', configurations)
    assert not keeps('[NONE [YES CO2]]', configurations)


def test_none_of_a_compound_toggle():
    toggle = '[NONE [AND [YES CO2] [YES OCC]]]'
    assert keeps(toggle, [zone(co2=True), zone(occ=True)])
    assert not keeps(toggle, [zone(co2=True, occ=True), zone()])


def test_one_configuration_is_enough_to_make_none_false():
    ''' `[NONE [ANY VAV DD]]`: one box is enough to delete the section, even if
        other configurations are not of that type
    '''
    assert not keeps('[NONE [ANY VAV DD]]', [ahu(), zone(), zone('DualDuct')])
    assert keeps('[NONE [ANY VAV DD]]', [ahu(), zone(), zone('CoolingOnly')])


@pytest.mark.parametrize('text, kept', [
    # NONE is false, as the first and as the second operand
    ('[AND [NONE [YES CO2]] [YES OCC]]', False),
    ('[AND [YES OCC] [NONE [YES CO2]]]', False),
    ('[OR [NONE [YES CO2]] [YES OCC]]', True),
    ('[OR [YES OCC] [NONE [YES CO2]]]', True),
    ('[OR [NONE [YES CO2]] [YES WIN]]', False),
    ('[OR [YES WIN] [NONE [YES CO2]]]', False),
    # NONE is true, as the first and as the second operand
    ('[AND [NONE [YES WIN]] [YES OCC]]', True),
    ('[AND [YES OCC] [NONE [YES WIN]]]', True),
    ('[AND [NONE [YES WIN]] [YES CO2]]', True),
    ('[OR [NONE [YES WIN]] [YES WIN]]', True),
    ('[OR [YES WIN] [NONE [YES WIN]]]', True),
    # NONE of a NONE that is false
    ('[NONE [NONE [YES CO2]]]', True),
])
def test_none_as_an_operand(text, kept):
    assert keeps(text, [zone(co2=True), zone(occ=True)]) is kept


# Project settings

def test_project_settings_are_read_on_every_configuration():
    setting = {NAME_MAP['VENT']: NAME_MAP['VT24']}
    assert keeps('[AND [EQUALS VENT VT24] [YES CO2]]', [{**zone(co2=True), **setting}, {**ahu(), **setting}])
    assert not keeps('[AND [EQUALS VENT 621] [YES CO2]]', [{**zone(co2=True), **setting}])


def test_project_without_configurations():
    ''' configuration_values gives the project settings alone '''
    project = [{NAME_MAP['VENT']: NAME_MAP['VT24']}]
    assert keeps('[EQUALS VENT VT24]', project)
    assert not keeps('[EQUALS VENT 621]', project)
    assert not keeps('[NO CO2]', project)
    assert keeps('[NONE [YES CO2]]', project)
