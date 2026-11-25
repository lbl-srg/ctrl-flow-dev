'''
Payload sent by the client (docs/selection-keys.md, "Payload")

Only what every consumer needs: the payload is read as JSON, and each
consumer gathers the values it needs. A consumer rejects a payload whose
schema version it does not support.
'''
from typing import Dict

SCHEMA_VERSION = 1


class PayloadError(ValueError):
    ''' A payload that cannot be read '''


def check_schema_version(payload: Dict) -> None:
    ''' Raises PayloadError if the schema version of the payload is not
        supported
    '''
    version = payload.get('schemaVersion') if isinstance(payload, dict) else None
    if version != SCHEMA_VERSION:
        raise PayloadError(f'Unsupported payload schema version: {version}')
