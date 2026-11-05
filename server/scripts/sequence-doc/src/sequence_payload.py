'''
Values of a project for the sequence document (docs/selection-keys.md,
"Sequence document").

A sequence document covers one project. Toggles are evaluated on each of its
configurations ("Evaluation").
'''
from typing import Any, Dict, List
from ctrlflow.payload import PayloadError, check_schema_version

# Values by key or system type: each one has a single value
Values = Dict[str, Any]


def check_payload(payload: Dict) -> None:
    ''' Raises PayloadError if the schema version is not supported or if the
        payload does not contain exactly one project
    '''
    check_schema_version(payload)
    projects = payload.get('projects', [])
    if len(projects) != 1:
        raise PayloadError(
            f'A sequence document covers exactly one project, got {len(projects)}')


def read_values(values: Dict) -> Values:
    ''' Only `value` is read: a redeclaration is read through the `typ`
        parameter of the redeclared class.
    '''
    return {key: attributes['value'] for key, attributes in values.items() if 'value' in attributes}


def project_values(payload: Dict) -> Values:
    ''' Project settings of the payload '''
    check_payload(payload)
    return read_values(payload['projects'][0]['values'])


def configuration_values(payload: Dict) -> List[Values]:
    ''' Values of each configuration of the project of the payload, as read by
        the toggles: the values of the configuration, the project settings, and
        for its system type, its template. A project without configurations
        gives the project settings alone.
    '''
    project = project_values(payload)
    configurations = payload['projects'][0]['configurations']
    return [
        {
            configuration['systemType']: configuration['template'],
            **read_values(configuration['values']),
            **project,
        }
        for configuration in configurations
    ] or [project]


def delete_info_box(payload: Dict) -> bool:
    ''' True if the info boxes are removed from the document '''
    return bool(payload.get('options', {}).get('deleteInfoBox', False))
