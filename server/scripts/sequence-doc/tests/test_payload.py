'''
Payload reader (docs/selection-keys.md, "Payload" and "Sequence document")
'''
import pytest
from payload import PayloadError, delete_info_box, project_selections

T1 = 'P.Templates.A'
T2 = 'P.Templates.B'


def configuration(template, values):
    return {
        'id': template,
        'description': '',
        'quantity': 1,
        'systemType': 'P.Templates',
        'template': template,
        'values': values,
    }


def payload(projects, version=1):
    return {
        'schemaVersion': version,
        'meta': {'ctrlFlow': '0.0.0', 'libraries': {}},
        'options': {'deleteInfoBox': True},
        'projects': projects,
    }


def project(configurations, values=None):
    return {
        'id': 'p',
        'description': '',
        'values': values or {},
        'configurations': configurations,
    }


def test_rejects_unsupported_schema_version():
    for version in (None, 0, 2):
        with pytest.raises(PayloadError, match='schema version'):
            project_selections(payload([project([])], version))
    with pytest.raises(PayloadError, match='schema version'):
        project_selections({'DEL_INFO_BOX': [False]})


def test_rejects_other_than_one_project():
    for projects in ([], [project([]), project([])]):
        with pytest.raises(PayloadError, match='exactly one project'):
            project_selections(payload(projects))


def test_gathers_the_values_of_the_project():
    selections = project_selections(payload([project(
        [
            configuration(T1, {
                f'{T1}-c.p': {'value': True, 'origin': 'user'},
                f'{T1}-c': {'redeclare': 'P.C', 'origin': 'evaluated'},
            }),
            configuration(T1, {f'{T1}-c.p': {'value': False, 'origin': 'evaluated'}}),
            configuration(T2, {f'{T2}-c.p': {'value': True, 'origin': 'user'}}),
        ],
        {'P.AllSystems-s': {'value': 'P.Types.S.A', 'origin': 'user'}},
    )]))
    assert selections == {
        # Templates of the configurations of a system type
        'P.Templates': [T1, T2],
        # Distinct values over the configurations of the template
        f'{T1}-c.p': [True, False],
        f'{T2}-c.p': [True],
        'P.AllSystems-s': ['P.Types.S.A'],
        # A redeclaration is not a value: f'{T1}-c' is absent
    }


def test_reads_the_options():
    assert delete_info_box(payload([project([])]))
    assert not delete_info_box({'options': {'deleteInfoBox': False}})
