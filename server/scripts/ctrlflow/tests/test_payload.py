'''
Payload (docs/selection-keys.md, "Payload")
'''
import pytest
from ctrlflow.payload import PayloadError, check_schema_version


def test_accepts_the_supported_schema_version():
    check_schema_version({'schemaVersion': 1, 'projects': []})


def test_rejects_unsupported_schema_version():
    for version in (None, 0, 2):
        with pytest.raises(PayloadError, match='schema version'):
            check_schema_version({'schemaVersion': version})
    # Payload of the client before #650
    with pytest.raises(PayloadError, match='schema version'):
        check_schema_version({'DEL_INFO_BOX': [False]})
    with pytest.raises(PayloadError, match='schema version'):
        check_schema_version([])
