'''
Modelica names, which may contain quoted identifiers (MLS 3.7 §2.3.1)

Port of server/src/parser/names.ts. A quoted identifier may contain ".", "-"
and escaped quotes, as in 'a.b', 'with-dash' or '13\'H'. Names are therefore
never split with a plain string split, but with the scanner below.
Specification: docs/selection-keys.md, "Parsing".
'''
import re
from typing import List

UNQUOTED_IDENT = r'[a-zA-Z_][a-zA-Z0-9_]*'
Q_CHAR = r'''[a-zA-Z0-9_!#$%&()*+,\-./:;<=>?@\[\]^{}|~ "]'''
S_ESCAPE = r'''\\['"?\\abfnrtv]'''
Q_IDENT = f"'(?:{Q_CHAR}|{S_ESCAPE})+'"
IDENT = f'(?:{UNQUOTED_IDENT}|{Q_IDENT})'
NAME_RE = re.compile(rf'\.?{IDENT}(?:\.{IDENT})*')
CLASS_NAME_RE = re.compile(rf'{UNQUOTED_IDENT}(?:\.{UNQUOTED_IDENT})*')


def indices_of(text: str, char: str) -> List[int]:
    ''' Indices of `char` outside quoted identifiers and string literals.
        Raises ValueError if a quoted identifier or a string literal is not
        closed.
    '''
    indices = []
    i = 0
    while i < len(text):
        quote = text[i]
        if quote not in ("'", '"'):
            if quote == char:
                indices.append(i)
            i += 1
            continue
        j = i + 1
        while j < len(text) and text[j] != quote:
            j += 2 if text[j] == '\\' else 1  # skip the escaped character
        if j >= len(text):
            kind = 'quoted identifier' if quote == "'" else 'string'
            raise ValueError(f'Unclosed {kind} in: {text}')
        i = j + 1
    return indices


def is_name(name: str) -> bool:
    ''' True if `name` is a Modelica name: [ "." ] IDENT { "." IDENT } '''
    return NAME_RE.fullmatch(name) is not None


def is_class_name(name: str) -> bool:
    ''' True if `name` is a class name without leading ".": its identifiers
        are not quoted (docs/selection-keys.md, "No quoted class identifiers")
    '''
    return CLASS_NAME_RE.fullmatch(name) is not None


def split_name(name: str) -> List[str]:
    ''' Splits a name into its identifiers: "a.'b.c'" gives ["a", "'b.c'"] '''
    parts = []
    start = 0
    for i in indices_of(name, '.'):
        parts.append(name[start:i])
        start = i + 1
    parts.append(name[start:])
    return parts
