import json
import argparse
import sys
from pathlib import Path
import logging
from typing import TextIO
from docx import Document
from functools import reduce
import csv
from docx.text.paragraph import Paragraph
from docx.table import Table
import re

#input_filename = 'Guideline 36 - Tagged.docx'
#output_filename = 'Guideline 36 - Edited.docx'
#input_filename = '2022-10-07 Guideline 36-2021 (sequence selection source).docx'
#output_filename = '2022-10-07 Guideline 36-2021.docx'
DEFAULT_DOC_VERSION = '2022-10-31 G36 Decisions'
INPUT_PATH = Path('version', DEFAULT_DOC_VERSION)\
    / '2022-10-07 Guideline 36-2021 (sequence selection source).docx'
OUTPUT_PATH = '2022-10-31 Guideline 36.docx'
MAPPINGS_PATH = Path('VERSION', '2022-10-31 G36 Decisions') / 'rev2-Table 1.csv'
MAPPINGS_SHORT_ID = 'Short ID'
MAPPINGS_MODELICA_PATH = 'Modelica Path'

P_TAG = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'
TABLE_TAG = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl'
ANNOTATION_STYLE = 'Toggle'

logging.getLogger().setLevel(logging.DEBUG)

def parse_args(args) -> str:
    parser = argparse.ArgumentParser(
        prog = 'GenerateSequenceDoc',
        description = 'Generates a sequence document from ctrl-flow selections'
    )
    parser.add_argument('-v', '--version', default=DEFAULT_DOC_VERSION)
    args = parser.parse_args(args)

    return args

def extract_input(input_stream: TextIO) -> dict:
    # TODO: define expected object type
    return json.load(input_stream)

def generate_short_map(version: str) -> dict:
    # load mappings
    MAPPINGS = {}

    with open(MAPPINGS_PATH) as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if row[MAPPINGS_SHORT_ID] and MAPPINGS.get(row[MAPPINGS_SHORT_ID]):
                logging.error('Duplicate entry for "%s"', row[MAPPINGS_SHORT_ID])
            if row[MAPPINGS_SHORT_ID]:
                MAPPINGS[row[MAPPINGS_SHORT_ID]] = row[MAPPINGS_MODELICA_PATH]

    return MAPPINGS

def __main__():
    '''
    '''
    args = parse_args([sys.argv[1:]])
    selections = extract_input(sys.stdin)

    # load source document starting point
    document = Document(INPUT_PATH)
    # load short code mappings
    mappings = generate_short_map(args.version)

    # start to create document using the source document as a starting point
    # set up list to track which document nodes should be deleted at the end
    nodes_to_delete = []

    # control_structure
    # iterate through input document and start building output document
    # 1. Go through paragraphs
    # 2. Go through tables

# document = Document(INPUT_PATH)
# nodes_to_delete = []

# MAPPINGS = {}

# with open(MAPPINGS_PATH) as fh:
#     reader = csv.DictReader(fh)
#     for row in reader:
#         if row[MAPPINGS_SHORT_ID] and MAPPINGS.get(row[MAPPINGS_SHORT_ID]):
#             logging.error('Duplicate entry for "%s"', row[MAPPINGS_SHORT_ID])
#         if row[MAPPINGS_SHORT_ID]:
#             MAPPINGS[row[MAPPINGS_SHORT_ID]] = row[MAPPINGS_MODELICA_PATH]
            
# # TODO: replace STORE with actual selections piped in from command line
# STORE = {
#     'Buildings.Templates.ZoneEquipment.Components.Controls.Interfaces.PartialVAVBoxController.have_CO2Sen': False,
#     #'Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon': 'BarometricRelief',
#     #'Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon': 'ReliefDamper',
#     #'Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon': 'ReliefFan',
#     #'Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon': 'ReturnFanMeasuredAir',
#     'Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon': 'ReturnFanCalculatedAir',
#     #'Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon': 'ReturnFanDp',
#     'Buildings.Templates.ZoneEquipment.Types.Configuration': 'CO',  # TODO, this should expand to "Buildings.Templates.ZoneEquipment.Types.Configuration.VAVBoxCoolingOnly"
#     'DEL_ENERGY_ASHRAE': True,
#     'DEL_ENERGY_TITLE24': False,
#     'DEL_VENTILATION_ASHRAE': True,
#     'DEL_VENTILATION_TITL24': False,
#     'UNITS': 'IP',
#     'DEL_INFO_BOX': False,
#     #'UNITS': 'SI',
# }

# def remove_node(node):
#     ''' Appends node to list to be removed
#     '''
#     #el = node._element
#     #el.getparent().remove(el)
#     nodes_to_delete.append(node)
    
# def find_for_deletion(doc, flag):
#     for para in doc.paragraphs:
#         if flag in para.text:
#             print(para.style)
#             yield para
            
#     for table in doc.tables:
#         for row in table.rows:
#             for cell in row.cells:
#                 if flag in cell.text:
#                     yield row




# def get_heading_level(paragraph):
#     style = paragraph.style.name
#     print(style)
#     match = re.match(r'Heading (\d+)', style)

#     if not match:
#         return 100
#     return int(match.group(1))


# def remove_info_box(paragraph):
#     remove_node(paragraph)

#     for sib_el in paragraph._element.itersiblings(P_TAG):
#         sib_p = Paragraph(sib_el, para._parent)
#         sib_level = get_heading_level(sib_p)
        
#         if (sib_level == 0):
#             for run in sib_p.runs:
#                 if run.element in RUN_OP_LOOKUP and RUN_OP_LOOKUP[run.element]['op'] in ('VENT', 'ENERGY'):
#                     # We've reached another VENT/ENERGY toggle, stop
#                     return
#         else:
#             # reached end of info box, stop
#             return
                
#         remove_node(sib_p)


# def remove_section(paragraph):
#     style = paragraph.style.name
#     level = get_heading_level(paragraph)
    
#     if style in ('Info. box', 'InfoboxList'):
#         return remove_info_box(paragraph)

#     for sib_el in paragraph._element.itersiblings():
#         if sib_el.tag == P_TAG:
#             sib_p = Paragraph(sib_el, para._parent)
#             sib_level = get_heading_level(sib_p)

#             if (sib_level <= level) and (sib_level != 9999):
#                 break

#             remove_node(sib_p)
#         elif sib_el.tag == TABLE_TAG:
#             sib_t = Table(sib_el, para._parent)
#             remove_node(sib_t)
#             logging.error('Deleted table')
#         else:
#             logging.error('Saw unrecognized tag "%s"', sib_el.tag)
#             print(paragraph.text)
#     remove_node(paragraph)

# ## Collect Control Structures

# CONTROL_STRUCTURES = []
# RUN_OP_LOOKUP = {}

# current = None

# for para in document.paragraphs:
#     for run in para.runs:
        
#         if (
#             (current and run.style.name != ANNOTATION_STYLE)
#             or
#             (current and para is not current['paragraph'])
#         ):
#             current['text'] = current['text'].strip()
#             if current['text']:
#                 CONTROL_STRUCTURES.append(current)
#             current = None
            
#         if not current and run.style.name == ANNOTATION_STYLE:
#             current = {
#                 'paragraph': para,
#                 'text': '',
#                 'runs': [],
#             }
#             RUN_OP_LOOKUP[run.element] = current

#         if current and run.style.name == ANNOTATION_STYLE:
#             RUN_OP_LOOKUP[run.element] = current
#             current['runs'].append(run)
#             current['text'] += run.text

# ## Tables

# for table in document.tables:
#     for row in table.rows:
#         for cell in row.cells:
#             for para in cell.paragraphs:
#                 for run in para.runs:
#                     if (
#                         (current and run.style.name != ANNOTATION_STYLE)
#                         or
#                         (current and para is not current['paragraph'])
#                     ):
#                         current['text'] = current['text'].strip()
#                         if current['text']:
#                             CONTROL_STRUCTURES.append(current)
#                         current = None

#                     if not current and run.style.name == ANNOTATION_STYLE:
#                         current = {
#                             'paragraph': para,
#                             'text': '',
#                             'runs': [],
#                         }
#                         run.op = current

#                     if current and run.style.name == ANNOTATION_STYLE:
#                         run.op = current
#                         current['runs'].append(run)
#                         current['text'] += run.text

# for op in CONTROL_STRUCTURES:
#     tokens = re.split(r'\W+', op['text'])
#     op['op'] = tokens[1]

# # Debugging
# for op in CONTROL_STRUCTURES:
#     print(op)

# # Remove Info and Instruction Boxes
# for para in document.paragraphs:
#     if STORE['DEL_INFO_BOX'] and para.style.name == 'Info. box':
#         remove_node(para)
#     if para.style.name == 'Instr. box':
#         remove_node(para)

# '''
# ### Standards/Ventilation Requirements

# + `[ENERGY 901]` - ASHRAE/IES Standard 90.1 economizer high-limit requirements
# + `[ENERGY T24]` - California Title 24 economizer high-limit requirements
# + `[VENT 621]` - ASHRAE Standard 62.1 ventilation requirements
# + `[VENT T24]` - California Title 24 ventilation requirements
# '''

# # Handle 
# for op in CONTROL_STRUCTURES:
#     if op['text'] == '[ENERGY 901]' and STORE['DEL_ENERGY_ASHRAE']:
#         remove_section(op['paragraph'])
#     if op['text'] == '[ENERGY T24]' and STORE['DEL_ENERGY_TITLE24']:
#         remove_section(op['paragraph'])
#     if op['text'] == '[VENT 621]' and STORE['DEL_VENTILATION_ASHRAE']:
#         remove_section(op['paragraph'])
#     if op['text'] == '[VENT T24]' and STORE['DEL_VENTILATION_TITL24']:
#         remove_section(op['paragraph'])

# '''
# ### Content Toggles

# + `[YES have_CO2Sen]` – Keep this section if a CO2 sensor is present. Otherwise remove.
# + `[NO have_CO2Sen]` – Keep this section if a CO2 sensor is not present. Otherwise remove.
# + `[EQUALS buiPreCon ReliefFan]` – Keep this section if the type of building pressure control system is an actuated relief damper, with relief fan(s). Otherwise remove.
# + **TODO** `[NOT_EQUALS buiPreCon RelifFan]` - Keep this section if the type of building pressure control system is *not* an actuated relief damper, with relief fans(s). Otherwise remove.
# + `[ANY buiPreCon ReturnFanMeasuredAir ReturnFanCalculatedAir]` – Keep this section if the type of building pressure control system is a return fan, tracking measured supply and return airflow or a return fan, tracking calculated supply and return airflow. Otherwise remove.
# + `[DELETE]` - Remove this section.
# '''

# for op in CONTROL_STRUCTURES:
#     if op['text'] != '[EQUALS VAV RH]':
#         continue
        
#     if op['op'] == 'YES':
#         tokens = re.split(r'\W+', op['text'])
#         short_name = tokens[2]
        
#         if short_name not in MAPPINGS:
#             logging.error('%s not found', short_name)
#             continue
            
#         long_name = MAPPINGS[short_name]
        
#         if long_name not in STORE:
#             logging.error('Path "%s" not found in store, deleting', long_name)
#             remove_section(op['paragraph'])
#         elif not STORE[long_name]:
#             remove_section(op['paragraph'])
            
    
#     if op['op'] == 'NO':
#         tokens = re.split(r'\W+', op['text'])
#         short_name = tokens[2]
        
#         if short_name not in MAPPINGS:
#             logging.error('%s not found', short_name)
#             continue
            
#         long_name = MAPPINGS[short_name]
                
#         if long_name not in STORE:
#             logging.error('Path "%s" not found in store, deleting', long_name)
#             remove_section(op['paragraph'])
#         elif STORE[long_name]:
#             remove_section(op['paragraph'])
            
    
#     if op['op'] == 'EQUALS':
#         tokens = re.split(r'\W+', op['text'])
#         short_name = tokens[2]
#         compare = tokens[3]
        
#         if short_name not in MAPPINGS:
#             logging.error('%s not found', short_name)
#             continue
            
#         long_name = MAPPINGS[short_name]
                
#         if long_name not in STORE:
#             logging.error('Path "%s" not found in store, deleting', long_name)
#             remove_section(op['paragraph'])
#         elif STORE[long_name] != compare:
#             remove_section(op['paragraph'])
            
    
#     if op['op'] == 'ANY':
#         tokens = [token for token in re.split(r'\W+', op['text']) if token]
#         short_name = tokens[1]
#         compare = tokens[2:]
        
#         if short_name not in MAPPINGS:
#             logging.error('%s not found', short_name)
#             continue
            
#         long_name = MAPPINGS[short_name]
                
#         if long_name not in STORE:
#             logging.error('Path "%s" not found in store, deleting', long_name)
#             remove_section(op['paragraph'])
#         elif STORE[long_name] not in compare:
#             remove_section(op['paragraph'])
            
    
#     if op['op'] == 'DELETE':
#         remove_section(op['paragraph'])

# '''
# ### TODO - Table Toggles
# + `[TABLE YES have_CO2Sen]`
# + `[ROW YES have_CO2Sen]`
# + `[COLUMN YES have_CO2Sen]`

# Tables will implement all of the content toggle operations (YES, NO, EQUALS, ANY) with an additional specifier indicating if the operation should apply to the entire table, a single row, or a single column.
# '''

# '''
# ### TODO - Inserting text
# + `[INSERT nZonPerGro]` – Insert the number of zones that each group contains.
# '''

# '''
# ### TODO - Units
# + `[UNITS [9 minutes per °C] [5 minutes per °F]]` – Insert either “9 minutes per °C” or “5 minutes per °F” depending on the configured unit system preference.
# + **TODO** `[CONVERT TOutRes_min]` – Insert the lowest value of the outdoor air temperature reset range converted to the user selected unit system (Celsius or Fahrenheit) and include unit representation. Ex: 9°F.
# '''
# for op in CONTROL_STRUCTURES:
#     if op['op'] == 'UNITS':
#         match = re.match(r'\[UNITS \[(.+)] \[(.+)]]', op['text'])
#         if not match:
#             logging.error('Invalid format for tag:  %s', op['text'])
#             continue
#         if STORE['UNITS'] == 'SI':
#             # TODO: use this as an approach for 'writes' to the docx 
#             op['runs'][0].text = match.group(1)
#             op['runs'][0].style = None
#         elif STORE['UNITS'] == 'IP':
#             op['runs'][0].text = match.group(2)
#             op['runs'][0].style = None
#         else:
#             logging.error('"%s" is not a valid unit system', STORE['UNITS'])

# for para in document.paragraphs:
#     for run in para.runs:
#         if run.style.name == ANNOTATION_STYLE:
#             remove_node(run)

# for table in document.tables:
#     for row in table.rows:
#         for cell in row.cells:
#             for para in cell.paragraphs:
#                 for run in para.runs:
#                     if run.style.name == ANNOTATION_STYLE:
#                         remove_node(run)

# for node in nodes_to_delete:
#     try:
#         el = node._element
#         el.getparent().remove(el)
#     except AttributeError:
#         logging.info('Element "%s" was already gone', el)
#         pass

# document.save(OUTPUT_PATH)