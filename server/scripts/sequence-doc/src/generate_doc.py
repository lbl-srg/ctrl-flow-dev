import json
import argparse
import sys
from pathlib import Path
import logging
from typing import TextIO
from docx import Document
import os
import csv
from mogrifier import mogrify_doc


DEFAULT_DOC_VERSION = 'Current G36 Decisions'
OUTPUT_PATH = 'Current Guideline 36.docx'
MAPPING_FILE_PATH = 'Guideline 36-2021 (mappings).csv'
SOURCE_DOC_PATH = 'Guideline 36-2021 (sequence selection source).docx'
MAPPINGS_SHORT_ID = 'Short ID'
MAPPINGS_MODELICA_INSTANCE = 'Modelica Parameter'
MAPPINGS_MODELICA_VALUES = 'Modelica Path'

ANNOTATION_STYLE = 'Toggle'

logging.getLogger().setLevel(logging.DEBUG)

def parse_args(args) -> str:
    parser = argparse.ArgumentParser(
        prog = 'GenerateSequenceDoc',
        description = 'Generates a sequence document from ctrl-flow selections'
    )
    parser.add_argument('-v', '--version', default=DEFAULT_DOC_VERSION)
    parser.add_argument('-o', '--output', default=OUTPUT_PATH)

    args = parser.parse_args(args)

    return args

def extract_input(input_stream: TextIO) -> dict:
    # TODO: define expected object type
    return json.load(input_stream)

def generate_name_map(mappings_path: str) -> dict:
    # load mappings
    mappings = {}

    with open(mappings_path) as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if row[MAPPINGS_SHORT_ID] and mappings.get(row[MAPPINGS_SHORT_ID]):
                logging.error('Duplicate entry for "%s"', row[MAPPINGS_SHORT_ID])
            if row[MAPPINGS_SHORT_ID]:
                mappings[row[MAPPINGS_SHORT_ID]] = row[MAPPINGS_MODELICA_INSTANCE] or row[MAPPINGS_MODELICA_VALUES]

    return mappings

def get_local_path_prefix(version: str) -> Path:
    return Path(os.path.dirname(__file__), 'version', version)

def generate_doc(selections, version) -> Document:
    ''' Gathers source document and short code map and
        passes everything on to doc mogrifier

        This is separated from main for easier testing
    '''
    local_file_prefix = get_local_path_prefix(version)

    # load source document starting point
    source_doc_path = local_file_prefix / SOURCE_DOC_PATH
    document = Document(source_doc_path)

    # load short code mappings
    short_code_path = local_file_prefix / MAPPING_FILE_PATH
    name_map = generate_name_map(short_code_path)

    return mogrify_doc(document, name_map, selections)

def main():
    '''
    '''
    args = parse_args(sys.argv[1:])
    selections = extract_input(sys.stdin)
    document = generate_doc(selections, args.version)
    document.save(args.output)

    return 0

if __name__ == '__main__':
    sys.exit(main())
