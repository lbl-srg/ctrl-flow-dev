'''
Selection keys and key patterns (docs/selection-keys.md, "Grammar" and
"Mappings")

A key is `<rootClass>-<elementPath>`. A key pattern lists several root
classes, e.g. `P.{A|B}-c.p` stands for `P.A-c.p` and `P.B-c.p`.
'''
import re
from typing import List, Tuple
from names import is_class_name, is_name, UNQUOTED_IDENT

CLASS_NAME = rf'{UNQUOTED_IDENT}(?:\.{UNQUOTED_IDENT})*'
SELECTOR_RE = re.compile(rf'(?:({CLASS_NAME})\.)?\{{({CLASS_NAME}(?:\|{CLASS_NAME})*)\}}')


def parse_key(key: str) -> Tuple[str, str]:
    ''' Root class and element path of a key. `rootClass` has no quoted
        identifier, so the first "-" is the separator.
        Raises ValueError if the key is invalid.
    '''
    root_class, sep, element_path = key.partition('-')
    if (
        not sep
        or not is_class_name(root_class)
        or not is_name(element_path)
        or element_path.startswith('.')
    ):
        raise ValueError(f'Invalid selection key: {key}')
    return root_class, element_path


def expand_pattern(pattern: str) -> List[str]:
    ''' Keys of a key pattern, in the order of the alternatives.
        A key is a pattern with a single class.
        Raises ValueError if the pattern is invalid.
    '''
    selector, _, element_path = pattern.partition('-')
    if is_class_name(selector):
        classes = [selector]
    else:
        match = SELECTOR_RE.fullmatch(selector)
        if not match:
            raise ValueError(f'Invalid key pattern: {pattern}')
        prefix, alternatives = match.groups()
        classes = [f'{prefix}.{a}' if prefix else a for a in alternatives.split('|')]
    keys = [f'{c}-{element_path}' for c in classes]
    for key in keys:
        parse_key(key)
    return keys


def is_pattern(text: str) -> bool:
    ''' True if `text` is a key pattern, and not a name such as a class, an
        enumeration literal or a system type
    '''
    try:
        expand_pattern(text)
    except ValueError:
        return False
    return True
