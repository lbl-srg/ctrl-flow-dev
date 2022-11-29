'''
This takes the source document and applies selections. Using logic baked into
the source document it gets modified based on the selections and the final document
gets returned, with all template language removed
'''
import re
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table
import logging

logging.getLogger().setLevel(logging.DEBUG)

P_TAG = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'
TABLE_TAG = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl'
ANNOTATION_STYLE = 'Toggle'

nodes_to_delete = []

def initialize_remove_list():
    ''' Resets global remove list to an empty array
    '''
    global nodes_to_delete
    nodes_to_delete = []

def remove_node(node):
    ''' Controls access to a global list for nodes to be deleted
    '''
    global nodes_to_delete
    nodes_to_delete.append(node)

def find_for_deletion(doc, flag):
    ''' Iterate 
    '''
    for para in doc.paragraphs:
        if flag in para.text:
            # print(para.style)
            yield para
            
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if flag in cell.text:
                    yield row

def get_heading_level(paragraph):
    style = paragraph.style.name
    # print(style)
    match = re.match(r'Heading (\d+)', style)

    if not match:
        return 100
    return int(match.group(1))


def remove_info_box(paragraph, run_op_lookup: dict):
    remove_node(paragraph)

    for sib_el in paragraph._element.itersiblings(P_TAG):
        sib_p = Paragraph(sib_el, paragraph._parent)
        sib_level = get_heading_level(sib_p)
        
        if (sib_level == 0):
            for run in sib_p.runs:
                if run.element in run_op_lookup and run_op_lookup[run.element]['op'] in ('VENT', 'ENERGY'):
                    # We've reached another VENT/ENERGY toggle, stop
                    return
        else:
            # reached end of info box, stop
            return
                
        remove_node(sib_p)


def remove_section(paragraph: Paragraph, run_op_lookup: dict):
    style = paragraph.style.name
    level = get_heading_level(paragraph)
    
    if style in ('Info. box', 'InfoboxList'):
        return remove_info_box(paragraph, run_op_lookup)

    for sib_el in paragraph._element.itersiblings():
        if sib_el.tag == P_TAG:
            sib_p = Paragraph(sib_el, paragraph._parent)
            sib_level = get_heading_level(sib_p)

            if (sib_level <= level) and (sib_level != 9999):
                break

            remove_node(sib_p)
        elif sib_el.tag == TABLE_TAG:
            sib_t = Table(sib_el, paragraph._parent)
            remove_node(sib_t)
            logging.error('Deleted table')
        else:
            logging.error('Saw unrecognized tag "%s"', sib_el.tag)
            print(paragraph.text)
    remove_node(paragraph)    

def create_control_structures(doc):
    control_structures = []
    run_op_lookup = {}

    current = None

    for para in doc.paragraphs:
        for run in para.runs:
            
            if (
                (current and run.style.name != ANNOTATION_STYLE)
                or
                (current and para is not current['paragraph'])
            ):
                current['text'] = current['text'].strip()
                if current['text']:
                    control_structures.append(current)
                current = None
                
            if not current and run.style.name == ANNOTATION_STYLE:
                current = {
                    'paragraph': para,
                    'text': '',
                    'runs': [],
                }
                run_op_lookup[run.element] = current

            if current and run.style.name == ANNOTATION_STYLE:
                run_op_lookup[run.element] = current
                current['runs'].append(run)
                current['text'] += run.text

    ## Tables

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    for run in para.runs:
                        if (
                            (current and run.style.name != ANNOTATION_STYLE)
                            or
                            (current and para is not current['paragraph'])
                        ):
                            current['text'] = current['text'].strip()
                            if current['text']:
                                control_structures.append(current)
                            current = None

                        if not current and run.style.name == ANNOTATION_STYLE:
                            current = {
                                'paragraph': para,
                                'text': '',
                                'runs': [],
                            }
                            run.op = current

                        if current and run.style.name == ANNOTATION_STYLE:
                            run.op = current
                            current['runs'].append(run)
                            current['text'] += run.text

    for op in control_structures:
        tokens = re.split(r'\W+', op['text'])
        op['op'] = tokens[1]

    # Debugging
    # for op in control_structures:
    #     print(op)

    return control_structures, run_op_lookup

def remove_info_and_instr_boxes(doc, selections):
    ''' Removes info and instruction boxes
    '''
    info_box_style = 'Info. box'
    instr_box_style = 'Instr. box'

    for para in doc.paragraphs:
        if selections['DEL_INFO_BOX'] and para.style.name == info_box_style:
            remove_node(para)
        if para.style.name == instr_box_style:
            remove_node(para)


def apply_vent_standard_selections(control_structure, run_op_lookup: dict, selections: dict):
    ''' 
    Modifies the control structure based on selections for ventilators

    ### Standards/Ventilation Requirements

    + `[ENERGY 901]` - ASHRAE/IES Standard 90.1 economizer high-limit requirements
    + `[ENERGY T24]` - California Title 24 economizer high-limit requirements
    + `[VENT 621]` - ASHRAE Standard 62.1 ventilation requirements
    + `[VENT T24]` - California Title 24 ventilation requirements
    '''
    for op in control_structure:
        if op['text'] == '[ENERGY 901]' and selections['DEL_ENERGY_ASHRAE']:
            remove_section(op['paragraph'], run_op_lookup)
        if op['text'] == '[ENERGY T24]' and selections['DEL_ENERGY_TITLE24']:
            remove_section(op['paragraph'], run_op_lookup)
        if op['text'] == '[VENT 621]' and selections['DEL_VENTILATION_ASHRAE']:
            remove_section(op['paragraph'], run_op_lookup)
        if op['text'] == '[VENT T24]' and selections['DEL_VENTILATION_TITL24']:
            remove_section(op['paragraph'], run_op_lookup)

    return control_structure # return not necessary but want to reinforce that this is getting modified

def apply_selections(control_structure, name_map, run_op_lookup, selections):
    ''' 
        Applies content toggles based on selections, doing the appropriate update based on the operator type

        Example toggles:
        + **TODO** `[DELETE]` - Delete this section.
        + `[YES have_CO2Sen]` – Keep this section if a CO2 sensor is present. Otherwise remove.
        + `[NO have_CO2Sen]` – Keep this section if a CO2 sensor is not present. Otherwise remove.
        + `[EQUALS buiPreCon ReliefFan]` – Keep this section if the type of building pressure control system is an actuated relief damper, with relief fan(s). Otherwise remove.
        + **TODO** `[NOT_EQUALS buiPreCon RelifFan]` - Keep this section if the type of building pressure control system is *not* an actuated relief damper, with relief fans(s). Otherwise remove.
        + `[ANY buiPreCon ReturnFanMeasuredAir ReturnFanCalculatedAir]` – Keep this section if the type of building pressure control system is a return fan, tracking measured supply and return airflow or a return fan, tracking calculated supply and return airflow. Otherwise remove.
        + `[DELETE]` - Remove this section.
    '''
    for op in control_structure:
        if op['text'] != '[EQUALS VAV RH]':
            continue
            
        if op['op'] == 'YES':
            # 1: map short name to long name
            tokens = re.split(r'\W+', op['text'])
            short_name = tokens[2]
            
            if short_name not in name_map:
                logging.error('%s not found', short_name)
                continue
                
            long_name = name_map[short_name]
            
            # 2: check if relevant selection is available
            if long_name not in selections:
                logging.error('Path "%s" not found in store, deleting', long_name)
                remove_section(op['paragraph'], run_op_lookup)
            # 3: apply the operation type
            elif not selections[long_name]:
                remove_section(op['paragraph'], run_op_lookup)
                
        
        if op['op'] == 'NO':
            tokens = re.split(r'\W+', op['text'])
            short_name = tokens[2]
            
            if short_name not in name_map:
                logging.error('%s not found', short_name)
                continue
                
            long_name = name_map[short_name]
                    
            if long_name not in selections:
                logging.error('Path "%s" not found in store, deleting', long_name)
                remove_section(op['paragraph'], run_op_lookup)
            elif selections[long_name]:
                remove_section(op['paragraph'], run_op_lookup)
                
        
        if op['op'] == 'EQUALS':
            tokens = re.split(r'\W+', op['text'])
            short_name = tokens[2]
            compare = tokens[3]
            
            if short_name not in name_map:
                logging.error('%s not found', short_name)
                continue
                
            long_name = name_map[short_name]
                    
            if long_name not in selections:
                logging.error('Path "%s" not found in store, deleting', long_name)
                remove_section(op['paragraph'], run_op_lookup)
            elif selections[long_name] != compare:
                remove_section(op['paragraph'], run_op_lookup)
                
        
        if op['op'] == 'ANY':
            tokens = [token for token in re.split(r'\W+', op['text']) if token]
            short_name = tokens[1]
            compare = tokens[2:]
            
            if short_name not in name_map:
                logging.error('%s not found', short_name)
                continue
                
            long_name = name_map[short_name]
                    
            if long_name not in selections:
                logging.error('Path "%s" not found in store, deleting', long_name)
                remove_section(op['paragraph'], run_op_lookup)
            elif selections[long_name] not in compare:
                remove_section(op['paragraph'], run_op_lookup)
                
        
        if op['op'] == 'DELETE':
            remove_section(op['paragraph'], run_op_lookup)

        # return not necessary - just reinforcing that control_structure is what is modified
        return control_structure

def apply_table_selections():
    '''
    Stub method for applying table selections
    ### TODO - Table Toggles
    + `[TABLE YES have_CO2Sen]`
    + `[ROW YES have_CO2Sen]`
    + `[COLUMN YES have_CO2Sen]`

    Tables will implement all of the content toggle operations (YES, NO, EQUALS, ANY) with an additional specifier indicating if the operation should apply to the entire table, a single row, or a single column.
    '''
    return

def convert_units(control_structure, selections):
    ''' Based on unit selection, goes through doc to update
    '''
    for op in control_structure:
        if op['op'] == 'UNITS':
            match = re.match(r'\[UNITS \[(.+)] \[(.+)]]', op['text'])
            if not match:
                logging.error('Invalid format for tag:  %s', op['text'])
                continue
            if selections['UNITS'] == 'SI':
                # TODO: use this as an approach for 'writes' to the docx 
                op['runs'][0].text = match.group(1)
                op['runs'][0].style = None
            elif selections['UNITS'] == 'IP':
                op['runs'][0].text = match.group(2)
                op['runs'][0].style = None
            else:
                logging.error('"%s" is not a valid unit system', selections['UNITS'])

def remove_toggles(doc):
    ''' Step through and remove 'toggle' text
    '''
    for para in doc.paragraphs:
        for run in para.runs:
            if run.style.name == ANNOTATION_STYLE:
                remove_node(run)

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    for run in para.runs:
                        if run.style.name == ANNOTATION_STYLE:
                            remove_node(run)

def mogrify_doc(doc: Document, name_map: dict, selections: dict) -> Document:
    ''' Applies selections to the provided document. This mutates the provided
        document
    '''
    initialize_remove_list()
    # walk through source_doc to find each conditional point in the doc
    control_structure, run_op_lookup = create_control_structures(doc)

    # Remove info and Instruction Boxes - updates remove_list internally
    remove_info_and_instr_boxes(doc, selections)

    # TODO: maybe could be combined in general 'apply_selections' call that handles
    # standards, paragraphs and tables
    # modify control_structure for vent and other standards
    apply_vent_standard_selections(control_structure, run_op_lookup, selections)

    # apply all paragraph selections
    apply_selections(control_structure, name_map, run_op_lookup, selections)

    # convert units
    convert_units(control_structure, selections)

    # TODO
    apply_table_selections()

    # remove toggle text?
    remove_toggles(doc)

    # finally remove all nodes flagged for deletion
    for node in nodes_to_delete:
        try:
            el = node._element
            el.getparent().remove(el)
        except AttributeError:
            logging.info('Element "%s" was already gone', el)
            pass

    return doc
