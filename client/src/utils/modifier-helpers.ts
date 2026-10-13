import type { Expression, Literal } from "../interpreter/interpreter";
import type { OptionInterface } from "../data/template";

/**
 * Value of an element in the stores: an assignment, a redeclaration, or both
 * (docs/selection-keys.md, "Values")
 */
export interface StoredValue {
  value?: Literal;
  redeclare?: string;
  /** Class prefixes of a redeclared short class element */
  kindOfClass?: string;
}

/** Values of the stores, by selection key */
export interface ConfigValues {
  [key: string]: StoredValue;
}

/**
 * Value object of the element declared by `option`: the class of a replaceable
 * element is a redeclaration, with the kind of class of a short class element.
 * The attributes are set from the declaration, never inferred from the value.
 */
export function storedValue(
  option: OptionInterface,
  value: Literal,
): StoredValue {
  if (!option.replaceable) {
    return { value };
  }
  return option.definition && option.kindOfClass
    ? { redeclare: value as string, kindOfClass: option.kindOfClass }
    : { redeclare: value as string };
}

/** Value of an element for the interpreter: its value, or else its class */
export function valueOf(stored: StoredValue): Literal | undefined {
  return stored.value ?? stored.redeclare;
}

export type Modifiers = {
  [key: string]: {
    expression?: Expression | string;
    final: boolean;
    redeclare?: string;
  };
};
