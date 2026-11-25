'''
Comments anchored on annotations (docs/sequence-doc.md, "Annotations")

Word places the reference mark of a comment right after the end of its range.
A comment anchored on part of an annotation puts that mark inside the
annotation. The mark is not text of the document, so it must not split the
annotation. An annotation is read up to its last run, even if no run
follows it.
'''
import pytest
from docx import Document
from docx.enum.style import WD_STYLE_TYPE
import mogrifier
import toggles

NAME_MAP = {
    'A': 'P.A-c.p',
    'B': 'P.Types.B',
    'UNITS': 'P.AllSystems-sysUni',
    'SI': 'P.Units.SI',
    'IP': 'P.Units.IP',
}
SI_PROJECT = {'P.AllSystems-sysUni': 'P.Units.SI'}
IP_PROJECT = {'P.AllSystems-sysUni': 'P.Units.IP'}


def new_document():
    doc = Document()
    doc.styles.add_style(mogrifier.ANNOTATION_STYLE, WD_STYLE_TYPE.CHARACTER)
    return doc


def new_paragraph(doc, location):
    ''' Empty paragraph in the body or in a table cell '''
    if location == 'body':
        return doc.add_paragraph()
    return doc.add_table(rows=1, cols=1).cell(0, 0).paragraphs[0]


def annotate(paragraph, parts, commented, style=mogrifier.ANNOTATION_STYLE):
    ''' Adds the parts of an annotation as runs of the given style, with a
        comment on the parts of index `commented`, and text after it
    '''
    runs = [paragraph.add_run(part, style) for part in parts]
    paragraph.part.document.add_comment(
        [runs[i] for i in commented], text='Review', author='Reviewer')
    paragraph.add_run(' Text')
    return runs


def annotation_texts(doc):
    control_structures, _ = mogrifier.create_control_structures(doc)
    return [op['text'] for op in control_structures]


LOCATIONS = ['body', 'table']


@pytest.mark.parametrize('location', LOCATIONS)
def test_comment_reference_does_not_split_an_annotation(location):
    doc = new_document()
    paragraph = new_paragraph(doc, location)
    annotate(paragraph, ['[EQUALS A ', 'B', ']'], commented=[1])
    assert any(mogrifier.is_comment_reference(run) for run in paragraph.runs)
    assert annotation_texts(doc) == ['[EQUALS A B]']


@pytest.mark.parametrize('location', LOCATIONS)
@pytest.mark.parametrize('commented', [[0], [1], [2], [0, 1, 2]])
def test_annotation_is_read_wherever_the_comment_is(location, commented):
    doc = new_document()
    annotate(new_paragraph(doc, location), ['[YES ', 'A', ']'], commented)
    assert annotation_texts(doc) == ['[YES A]']


@pytest.mark.parametrize('location', LOCATIONS)
def test_another_style_still_ends_an_annotation(location):
    doc = new_document()
    paragraph = new_paragraph(doc, location)
    paragraph.add_run('[EQUALS A ', mogrifier.ANNOTATION_STYLE)
    paragraph.add_run('B', mogrifier.ANNOTATION_STYLE)
    paragraph.add_run(' ')
    paragraph.add_run(']', mogrifier.ANNOTATION_STYLE)
    paragraph.add_run(' Text')
    texts = annotation_texts(doc)
    assert texts == ['[EQUALS A B', ']']
    with pytest.raises(toggles.ToggleError, match='unbalanced brackets'):
        toggles.parse(texts[0], NAME_MAP)


@pytest.mark.parametrize('location', LOCATIONS)
@pytest.mark.parametrize('project, text', [(SI_PROJECT, 'Setpoint 12 Pa Text'), (IP_PROJECT, 'Setpoint 0.05 in. Text')])
def test_units_with_a_comment_reference_is_replaced(location, project, text):
    doc = new_document()
    paragraph = new_paragraph(doc, location)
    paragraph.add_run('Setpoint ')
    annotate(paragraph, ['[UNITS [12 Pa] ', '[0.05 in.]]'], commented=[0])
    mogrifier.mogrify_doc(doc, NAME_MAP, project, [project])
    assert paragraph.text == text


def comment_markers(doc):
    ''' Comment IDs of each kind of marker of the body '''
    body = doc.element.body
    return {
        kind: sorted(element.get(f'{{{mogrifier.W_NS}}}id') for element in body.iter(f'{{{mogrifier.W_NS}}}{kind}'))
        for kind in ('commentRangeStart', 'commentRangeEnd', 'commentReference')
    }


@pytest.mark.parametrize('location', LOCATIONS)
def test_removed_sections_leave_complete_comments(location):
    ''' A removed section takes the markers of its comments with it, and the
        comments of a kept section keep all of their markers
    '''
    doc = new_document()
    annotate(new_paragraph(doc, location), ['[NO ', 'A', ']'], commented=[1])
    removed = doc.add_paragraph(style='Heading 1')
    annotate(removed, ['[YES ', 'A', ']'], commented=[1])
    doc.add_paragraph('Removed')
    kept_id = str(next(iter(doc.comments)).comment_id)
    mogrifier.mogrify_doc(doc, NAME_MAP, {}, [{'P.A-c.p': False}])
    assert 'Removed' not in [paragraph.text for paragraph in doc.paragraphs]
    markers = comment_markers(doc)
    assert markers == {kind: [kept_id] for kind in markers}


@pytest.mark.parametrize('location', LOCATIONS)
def test_annotation_in_the_last_run_is_read(location):
    ''' No run follows the annotation that ends the body or the last table '''
    doc = new_document()
    new_paragraph(doc, location).add_run('[YES A]', mogrifier.ANNOTATION_STYLE)
    assert annotation_texts(doc) == ['[YES A]']


def test_annotation_that_ends_the_body_is_not_extended_by_a_table():
    doc = new_document()
    doc.add_paragraph().add_run('[YES A]', mogrifier.ANNOTATION_STYLE)
    new_paragraph(doc, 'table').add_run('[NO A]', mogrifier.ANNOTATION_STYLE)
    assert annotation_texts(doc) == ['[YES A]', '[NO A]']
