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
import toggles
import utils
from sequence_payload import Values
from typing import Dict, List

P_TAG = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'
BOOKMARK_TAGS = ['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bookmarkEnd', "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bookmarkStart"]
SECTION_TAG = ["{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sectPr"]
TABLE_TAG = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl'
ANNOTATION_STYLE = 'Toggle'
UNITS_SHORT_NAME = 'UNITS'

elements_to_delete = []
_run_style_name_cache = {}
_paragraph_style_name_cache = {}

def initialize_remove_list():
    ''' Resets global remove list and style name caches for a fresh doc
    '''
    global elements_to_delete
    elements_to_delete = []
    _run_style_name_cache.clear()
    _paragraph_style_name_cache.clear()

def get_run_style_name(run):
    ''' Cached lookup of a run's character style name.
        python-docx re-walks the whole style tree on every call to
        Styles.default()/get_by_id() with no internal caching, so calling
        run.style.name for every run in the document (most of which fall
        back to the default style) made style resolution the dominant cost.
        The style id -> name mapping can't change while we process a doc,
        so cache it here keyed by (part, style id).
    '''
    key = (run.part, run.element.style)
    try:
        return _run_style_name_cache[key]
    except KeyError:
        name = run.style.name
        _run_style_name_cache[key] = name
        return name

def get_paragraph_style_name(paragraph):
    ''' Cached lookup of a paragraph's style name, see get_run_style_name
    '''
    key = (paragraph.part, paragraph._p.style)
    try:
        return _paragraph_style_name_cache[key]
    except KeyError:
        name = paragraph.style.name
        _paragraph_style_name_cache[key] = name
        return name

def remove_node(node):
    ''' Controls access to a global list for nodes to be deleted
    '''
    try:
       remove_element(node._element)
    except AttributeError:
        # node is actually an element, not a Paragraph
        remove_element(node)

def remove_element(element):
    ''' Adds a lxml element to global list for deletion
    '''
    global elements_to_delete
    elements_to_delete.append(element)

def get_heading_level(paragraph):
    ''' Gets heading level of paragraph
    '''
    style = get_paragraph_style_name(paragraph)
    match = re.match(r'Heading (\d+)', style)

    if not match:
        logging.info('Saw unrecognized style: {}'.format(style))
        return 100
    return int(match.group(1))

def remove_info_box(paragraph, run_op_lookup: Dict):
    '''
        Removes info box text within a section (paragraph is a detected info box in a section)
        Also removes any sibling elements within the paragraph
    '''
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

def remove_section(paragraph: Paragraph, run_op_lookup: Dict):
    ''' Removes a section of text and its siblings
    '''
    style = get_paragraph_style_name(paragraph)
    level = get_heading_level(paragraph)

    if style in ('Info. box', 'InfoboxList', 'InfoTableTitle'):
        return remove_info_box(paragraph, run_op_lookup)

    for sib_el in paragraph._element.itersiblings():
        if sib_el.tag == P_TAG:
            sib_p = Paragraph(sib_el, paragraph._parent)
            sib_level = get_heading_level(sib_p)

            if (sib_level <= level) and (sib_level != 9999):
                break

            remove_node(sib_p)
        elif sib_el.tag == TABLE_TAG:
            # Assume table matches indentation of parent paragraph
            # so just go ahead and remove
            sib_t = Table(sib_el, paragraph._parent)
            remove_node(sib_t)
        elif sib_el.tag in BOOKMARK_TAGS:
            remove_node(sib_el)
        elif sib_el.tag in SECTION_TAG:
            break
        else:
            logging.error('Saw unrecognized tag "%s"', sib_el.tag)

    remove_node(paragraph)

def edit_table(table_item):
    ''' Removes items from table or whole table depending on the operation
    '''
    if table_item['op'] == 'COLUMN':
        for cell in table_item['column'].cells:
            remove_node(cell)

    if table_item['op'] == 'ROW':
        remove_node(table_item['row'])

    if table_item['op'] == 'TABLE':
        remove_node(table_item['table'])

def get_column(table: Table, table_cell):
    ''' Determins the column of a cell within a table
    '''
    for column in table.columns:
        for cell in column.cells:
            if cell.text == table_cell.text:
                return column

def create_control_structures(doc):
    ''' Sets up the control structure for Sections and Tables
    '''
    control_structures = []
    run_op_lookup = {}

    current = None

    ## Sections
    for para in doc.paragraphs:
        for run in para.runs:
            run_style_name = get_run_style_name(run)
            if (
                (current and run_style_name != ANNOTATION_STYLE)
                or
                (current and para is not current['paragraph'])
            ):
                current['text'] = current['text'].strip()
                if current['text']:
                    control_structures.append(current)
                current = None

            if not current and run_style_name == ANNOTATION_STYLE:
                current = {
                    'paragraph': para,
                    'text': '',
                    'runs': [],
                }
                run_op_lookup[run.element] = current

            if current and run_style_name == ANNOTATION_STYLE:
                run_op_lookup[run.element] = current
                current['runs'].append(run)
                current['text'] += run.text

    ## Tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    for run in para.runs:
                        run_style_name = get_run_style_name(run)
                        if (
                            (current and run_style_name != ANNOTATION_STYLE)
                            or
                            (current and para is not current['paragraph'])
                        ):
                            current['text'] = current['text'].strip()
                            if current['text']:
                                control_structures.append(current)
                            current = None

                        if not current and run_style_name == ANNOTATION_STYLE:
                            current = {
                                'paragraph': para,
                                'text': '',
                                'runs': [],
                                'table': table,
                                'row': row,
                                'column': get_column(table, cell),
                                'cell': cell,
                            }
                            run.op = current

                        if current and run_style_name == ANNOTATION_STYLE:
                            run.op = current
                            current['runs'].append(run)
                            current['text'] += run.text

    for op in control_structures:
        tokens = utils.remove_empty_strings(re.split(r'\W+', op['text']))
        if tokens:
            op['op'] = tokens[0]
        else:
            op['op'] = ''

    # Debugging
    # for op in control_structures:
    #     logging.info(op)

    return control_structures, run_op_lookup

def remove_info_and_instr_boxes(doc, delete_info_box: bool):
    ''' Removes instruction boxes, and info boxes if `delete_info_box`
    '''
    info_box_styles = ['Info. box', 'InfoboxList', 'InfoTableTitle']
    instr_box_style = 'Instr. box'

    for para in doc.paragraphs:
        para_style_name = get_paragraph_style_name(para)
        if delete_info_box and para_style_name in info_box_styles:
            remove_node(para)
        if para_style_name == instr_box_style:
            remove_node(para)

def apply_selections(control_structure, name_map, run_op_lookup, configurations: List[Values]):
    '''
        Removes what the toggles do not keep (see toggles.py): the section of
        a toggle, or the part of a table of a table toggle.
    '''
    for op in control_structure:
        if op['op'] == UNITS_SHORT_NAME:
            continue

        toggle = toggles.parse(op['text'], name_map)
        if not toggles.keeps(toggle, configurations):
            if op['op'] in toggles.TABLE_OP_LIST:
                edit_table(op)
            else:
                remove_section(op['paragraph'], run_op_lookup)

    # return not necessary - just reinforcing that control_structure is what is modified
    return control_structure

def convert_units(control_structure, name_map, project: Values):
    ''' Based on unit selection, goes through doc to update
    '''
    short_name = UNITS_SHORT_NAME
    si_short_name = "SI"
    ip_short_name = "IP"

    if short_name not in name_map:
        logging.error('%s not found', short_name)
        return
    if si_short_name not in name_map:
        logging.error('%s not found', si_short_name)
        return
    if ip_short_name not in name_map:
        logging.error('%s not found', ip_short_name)
        return

    long_name = name_map[short_name]
    si_long_name = name_map[si_short_name]
    ip_long_name = name_map[ip_short_name]

    if long_name not in project:
        logging.info('Path "%s" not found in store', long_name)
        return

    for op in control_structure:
        if op['op'] == short_name:
            match = re.match(r'\[UNITS \[(.+)] \[(.+)]]', op['text'])
            if not match:
                logging.error('Invalid format for tag:  %s', op['text'])
                continue
            unit_selection = project[long_name]
            if unit_selection == si_long_name:
                # TODO: use this as an approach for 'writes' to the docx
                op['runs'][0].text = match.group(1)
                op['runs'][0].style = None
            elif unit_selection == ip_long_name:
                op['runs'][0].text = match.group(2)
                op['runs'][0].style = None
            else:
                logging.error('"%s" is not a valid unit system', unit_selection)

def remove_toggles(doc):
    ''' Step through and remove 'toggle' text
    '''
    for para in doc.paragraphs:
        for run in para.runs:
            if get_run_style_name(run) == ANNOTATION_STYLE:
                remove_node(run)

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    for run in para.runs:
                        if get_run_style_name(run) == ANNOTATION_STYLE:
                            remove_node(run)

def mogrify_doc(doc: Document, name_map: Dict, project: Values, configurations: List[Values],
                delete_info_box: bool = False) -> Document:
    ''' Applies the values of a project (sequence_payload.project_values and
        configuration_values) to the provided document. This mutates the
        provided document
    '''
    initialize_remove_list()
    # walk through source_doc to find each conditional point in the doc
    control_structure, run_op_lookup = create_control_structures(doc)

    # Remove info and Instruction Boxes - updates remove_list internally
    remove_info_and_instr_boxes(doc, delete_info_box)

    # apply all paragraph and table selections
    apply_selections(control_structure, name_map, run_op_lookup, configurations)

    # convert units
    convert_units(control_structure, name_map, project)

    # remove toggle text
    remove_toggles(doc)

    # finally remove all nodes flagged for deletion
    for el in elements_to_delete:
        try:
            el.getparent().remove(el)
        except AttributeError:
            logging.info('Element "%s" was already gone', el)
            pass

    return doc
