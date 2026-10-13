'''
Values of a project for the sequence document (docs/selection-keys.md,
"Sequence document").

A sequence document covers one project. Toggles evaluate over the values of
the project, gathered across its configurations ("Aggregation").
'''
from typing import Dict, List
from ctrlflow.payload import PayloadError, check_schema_version

# Values of a project, by key or system type
Selections = Dict[str, List]


def check_payload(payload: Dict) -> None:
    ''' Raises PayloadError if the schema version is not supported or if the
        payload does not contain exactly one project
    '''
    check_schema_version(payload)
    projects = payload.get('projects', [])
    if len(projects) != 1:
        raise PayloadError(
            f'A sequence document covers exactly one project, got {len(projects)}')


def project_selections(payload: Dict) -> Selections:
    ''' Values of the project of the payload, as read by the toggles:
        - a system type gives the templates of its configurations;
        - a key gives the distinct values it takes in the configurations,
          or the value of the project setting.
        Only `value` is read: a redeclaration is read through the `typ`
        parameter of the redeclared class.
    '''
    check_payload(payload)
    project = payload['projects'][0]
    selections: Selections = {}

    def add(key, value):
        values = selections.setdefault(key, [])
        if value not in values:
            values.append(value)

    for configuration in project['configurations']:
        add(configuration['systemType'], configuration['template'])
        for key, attributes in configuration['values'].items():
            if 'value' in attributes:
                add(key, attributes['value'])
    for key, attributes in project['values'].items():
        if 'value' in attributes:
            add(key, attributes['value'])
    return selections


def delete_info_box(payload: Dict) -> bool:
    ''' True if the info boxes are removed from the document '''
    return bool(payload.get('options', {}).get('deleteInfoBox', False))
