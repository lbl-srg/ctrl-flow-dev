'''
Values of a project for the sequence document (docs/selection-keys.md,
"Sequence document")
'''
import pytest
from ctrlflow.payload import PayloadError
from sequence_payload import configuration_values, delete_info_box, project_values

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
            configuration_values(payload([project([])], version))
    with pytest.raises(PayloadError, match='schema version'):
        project_values({'DEL_INFO_BOX': [False]})


def test_rejects_other_than_one_project():
    for projects in ([], [project([]), project([])]):
        with pytest.raises(PayloadError, match='exactly one project'):
            configuration_values(payload(projects))


def test_reads_the_values_of_each_configuration():
    data = payload([project(
        [
            configuration(T1, {
                f'{T1}-c.p': {'value': True, 'origin': 'user'},
                f'{T1}-c': {'redeclare': 'P.C', 'origin': 'evaluated'},
            }),
            configuration(T1, {f'{T1}-c.p': {'value': False, 'origin': 'evaluated'}}),
            configuration(T2, {f'{T2}-c.p': {'value': True, 'origin': 'user'}}),
        ],
        {
            'P.AllSystems-s': {'value': 'P.Types.S.A', 'origin': 'user'},
            'P.AllSystems-r': {'redeclare': 'P.R', 'origin': 'user'},
        },
    )])
    setting = {'P.AllSystems-s': 'P.Types.S.A'}
    assert project_values(data) == setting
    assert configuration_values(data) == [
        # A redeclaration is not a value: f'{T1}-c' is absent
        {'P.Templates': T1, f'{T1}-c.p': True, **setting},
        {'P.Templates': T1, f'{T1}-c.p': False, **setting},
        {'P.Templates': T2, f'{T2}-c.p': True, **setting},
    ]


def test_project_without_configurations_gives_the_project_settings():
    setting = {'P.AllSystems-s': {'value': 'P.Types.S.A', 'origin': 'user'}}
    assert configuration_values(payload([project([], setting)])) == [{'P.AllSystems-s': 'P.Types.S.A'}]


def test_reads_the_options():
    assert delete_info_box(payload([project([])]))
    assert not delete_info_box({'options': {'deleteInfoBox': False}})
