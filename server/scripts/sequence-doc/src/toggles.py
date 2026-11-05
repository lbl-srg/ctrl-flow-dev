'''
Toggles of the sequence document (docs/sequence-doc.md, "Annotations").

A toggle is parsed into a tree by balanced brackets, then evaluated on each
configuration of the project: a section is kept if its toggle is true on at
least one configuration.

Example toggles:
+ `[YES CO2]` - True on a configuration with a CO2 sensor.
+ `[NO CO2]` - True on a configuration without a CO2 sensor.
+ `[EQUALS BSP RELIEFDMPR]` - True on a configuration whose building pressure control is an actuated relief damper.
+ `[NOT_EQUALS BSP RELIEFDMPR]` - True on a configuration whose building pressure control is *not* an actuated relief damper.
+ `[ANY BSP RETURNTRACK RELIEFDMPR]` - True on a configuration whose building pressure control is one of the listed types.
+ `[AND [any toggle] [any toggle]]` - True on a configuration if both nested toggles are true on it.
+ `[OR [any toggle] [any toggle]]` - True on a configuration if one of the nested toggles is true on it.
+ `[NONE [any toggle]]` - True if the nested toggle is false on every configuration.
+ `[DELETE]` - Never true.

Example table toggles, which apply a toggle to a part of a table:
+ `[TABLE YES CO2]` - Applies to the whole table.
+ `[ROW YES CO2]` or `[ROW [YES CO2]]` - Applies to this row.
+ `[COLUMN AND [any toggle] [any toggle]]` - Applies to this column.
'''
import re
from collections import deque
from dataclasses import dataclass
from typing import Deque, Dict, List, Tuple
from ctrlflow import keys
from sequence_payload import Values

TOKEN_RE = re.compile(r'\[|\]|[^\s\[\]]+')
TABLE_OP_LIST = ['TABLE', 'ROW', 'COLUMN']
# Operation: (minimum, maximum) number of short IDs, None if unbounded
LEAF_OPS = {
    'YES': (1, 1),
    'NO': (1, 1),
    'EQUALS': (2, 2),
    'NOT_EQUALS': (2, 2),
    'ANY': (2, None),
    'DELETE': (0, 0),
}
# Operation: number of nested toggles
NESTED_OPS = {'AND': 2, 'OR': 2, 'NONE': 1}


class ToggleError(ValueError):
    ''' Invalid toggle, or toggle with an unknown short ID '''


@dataclass(frozen=True)
class Toggle:
    op: str
    keys: Tuple[str, ...] = ()  # What a leaf reads: a system type, or the keys of a key or pattern
    compare: Tuple[str, ...] = ()  # What a leaf compares it to
    operands: Tuple['Toggle', ...] = ()


def long_name(short_id: str, name_map: Dict) -> str:
    ''' Long name of a short ID of the mappings '''
    if short_id not in name_map:
        raise ToggleError(f'{short_id} not in the mappings')
    return name_map[short_id]


def read_keys(short_id: str, name_map: Dict) -> Tuple[str, ...]:
    ''' What a short ID reads in the values of a configuration '''
    name = long_name(short_id, name_map)
    return tuple(keys.expand_pattern(name)) if keys.is_pattern(name) else (name,)


def take(tokens: Deque[str]) -> str:
    ''' Next token of a toggle '''
    if not tokens:
        raise ToggleError('unbalanced brackets')
    return tokens.popleft()


def expect(tokens: Deque[str], token: str) -> None:
    ''' Consumes the next token of a toggle, which must be `token` '''
    found = take(tokens)
    if found != token:
        raise ToggleError(f'expected {token!r}, got {found!r}')


def parse_leaf(op: str, tokens: Deque[str], name_map: Dict) -> Toggle:
    ''' Leaf toggle, after its operation '''
    short_ids = []
    while tokens and tokens[0] not in ('[', ']'):
        short_ids.append(tokens.popleft())
    minimum, maximum = LEAF_OPS[op]
    if len(short_ids) < minimum or (maximum is not None and len(short_ids) > maximum):
        raise ToggleError(f'{len(short_ids)} short IDs for {op}')
    if not short_ids:
        return Toggle(op)
    return Toggle(
        op,
        keys=read_keys(short_ids[0], name_map),
        compare=tuple(long_name(short_id, name_map) for short_id in short_ids[1:]),
    )


def parse_nested(op: str, tokens: Deque[str], name_map: Dict) -> Toggle:
    ''' Toggle with nested toggles, after its operation '''
    operands = []
    while tokens and tokens[0] == '[':
        operands.append(parse_brackets(tokens, name_map))
    if len(operands) != NESTED_OPS[op]:
        raise ToggleError(f'{len(operands)} nested toggles for {op}')
    return Toggle(op, operands=tuple(operands))


def parse_operation(tokens: Deque[str], name_map: Dict) -> Toggle:
    ''' Operation and its arguments, up to the closing bracket '''
    op = take(tokens)
    if op in LEAF_OPS:
        return parse_leaf(op, tokens, name_map)
    if op in NESTED_OPS:
        return parse_nested(op, tokens, name_map)
    raise ToggleError(f'unknown operation {op!r}')


def parse_brackets(tokens: Deque[str], name_map: Dict) -> Toggle:
    ''' Toggle enclosed in brackets '''
    expect(tokens, '[')
    toggle = parse_operation(tokens, name_map)
    expect(tokens, ']')
    return toggle


def parse_table(tokens: Deque[str], name_map: Dict) -> Toggle:
    ''' Table toggle, after its operation: the toggle that follows, with or
        without brackets
    '''
    if tokens and tokens[0] == '[':
        return parse_brackets(tokens, name_map)
    return parse_operation(tokens, name_map)


def parse(text: str, name_map: Dict) -> Toggle:
    ''' Tree of a toggle: for a table toggle, the toggle that follows TABLE,
        ROW or COLUMN. Raises ToggleError if the toggle is invalid or if a
        short ID is not in the mappings, so that no error can be mistaken for
        a toggle that is false, which NONE would negate.
    '''
    tokens = deque(TOKEN_RE.findall(text))
    try:
        expect(tokens, '[')
        if tokens and tokens[0] in TABLE_OP_LIST:
            tokens.popleft()
            toggle = parse_table(tokens, name_map)
        else:
            toggle = parse_operation(tokens, name_map)
        expect(tokens, ']')
        if tokens:
            raise ToggleError('text after the closing bracket')
    except ToggleError as error:
        raise ToggleError(f'Invalid toggle {text}: {error}') from error
    return toggle


def is_true(toggle: Toggle, values: Values, configurations: List[Values]) -> bool:
    ''' Value of a toggle on a configuration, given by its `values`. A key that
        the configuration does not have satisfies no leaf, including NO and
        NOT_EQUALS: otherwise an AHU would satisfy `[NO CO2]`.
    '''
    if toggle.op == 'DELETE':
        return False
    if toggle.op == 'AND':
        return all(is_true(t, values, configurations) for t in toggle.operands)
    if toggle.op == 'OR':
        return any(is_true(t, values, configurations) for t in toggle.operands)
    if toggle.op == 'NONE':
        return not keeps(toggle.operands[0], configurations)

    present = [key for key in toggle.keys if key in values]
    if not present:
        return False
    if len(present) > 1:
        raise ToggleError(f'One configuration has several keys of a pattern: {present}')
    value = values[present[0]]

    if toggle.op == 'YES':
        return bool(value)
    if toggle.op == 'NO':
        return not value
    if toggle.op == 'EQUALS':
        return value == toggle.compare[0]
    if toggle.op == 'NOT_EQUALS':
        return value != toggle.compare[0]
    return value in toggle.compare  # ANY


def keeps(toggle: Toggle, configurations: List[Values]) -> bool:
    ''' True if the toggle is true on at least one configuration '''
    return any(is_true(toggle, values, configurations) for values in configurations)
