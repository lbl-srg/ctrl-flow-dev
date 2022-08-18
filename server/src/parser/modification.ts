import { ShortClassSpecifier } from "./mj-types";
import { typeStore } from "./parser";
/**
 * Modifications are places where there is an assignment, e.g.
 * 'my_param=5'. Modifications can also contain groups of modifications, e.g.
 * ```
 * MyClass myClassInstance(
 *  myclassParam=true,
 *  anotherMyClassParam=5
 * )
 * ```
 * The above becomes three modifiers, one for 'myClassInstance', and two for
 * the key/value assigned parameters
 *
 * Modifications are used in all places where there are assignments, so this includes
 * annotations that contain purely UI related data, or with the 'graphic' tag that
 * contains SVG data.
 *
 * Parameter modifications are kept in a store using a modelica path. All other
 * modifications (annotation, graphic) are not put in the store.
 *
 * TODO: this store could potentially be used to help simplify expressions. If we
 * don't end up going this route, the store should be removed.
 */

import { Expression, getExpression } from "./expression";

const modStore: Map<string, Modification> = new Map();

type ComponentDeclaration1 = {
  declaration: DeclarationBlock;
  description?: DescriptionBlock;
};

type ComponentClause1 = {
  type_specifier: string; // Modelica Path
  component_declaration1: ComponentDeclaration1;
};

type ShortClassDefinition = {
  class_prefixes: string; // //(PARTIAL)? (CLASS | MODEL | (OPERATOR)? RECORD | BLOCK | (EXPANDABLE)? CONNECTOR | TYPE | PACKAGE | ((PURE | IMPURE))? (OPERATOR)? FUNCTION | OPERATOR),
  short_class_specifier: ShortClassSpecifier; // from 'parser.ts'
};

type ElementReplaceable = {
  component_clause1: ComponentClause1;
  short_class_definition: ShortClassDefinition;
};

type RedeclareMod = {
  element_redeclaration: {
    each: boolean;
    final: boolean;
    short_class_definition?: ShortClassDefinition;
    element_replaceable?: ElementReplaceable;
    component_clause1?: ComponentClause1;
  };
};

type ClassMod = {
  class_modification: (WrappedMod | RedeclareMod)[];
};

type Assignment = {
  equal: boolean;
  expression: {
    simple_expression: string; // JSON deserializable value
  };
};

// Replacable
export type WrappedMod = {
  element_modification_or_replaceable: {
    element_modification: Mod;
  };
};

export type Mod = {
  name: string;
  modification: ClassMod | WrappedMod | Assignment | RedeclareMod;
};

export type DeclarationBlock = {
  identifier: string;
  modification?: ClassMod | WrappedMod | Assignment | RedeclareMod;
};

export type DescriptionBlock = {
  description_string: string;
  annotation?: any;
};

// export type Expression = {
//   modelicaPath: string;
//   expression: string;
// };

export function getModificationList(
  classMod: ClassMod,
  typePath: string,
  name = "",
) {
  return classMod.class_modification
    .map((m) =>
      createModification({
        definition: m as WrappedMod,
        typePath,
        name,
      }),
    )
    .filter((m) => m !== undefined) as Modification[];
}

interface ModificationBasics {
  typePath?: string;
  name?: string;
  value?: any;
  definition?: any;
  type?: string;
}

interface ModificationWithDefinition extends ModificationBasics {
  definition: WrappedMod | Mod | DeclarationBlock | RedeclareMod;
  value?: never;
}

interface ModificationWithValue extends ModificationBasics {
  definition?: never;
  value: any;
  name: string;
}

type ModificationProps = ModificationWithDefinition | ModificationWithValue;

function unpackRedeclaration(props: ModificationProps) {
  let { definition } = props;
  const redeclaration = (definition as RedeclareMod).element_redeclaration;
  if ("component_clause1" in redeclaration) {
    const componentClause1 =
      redeclaration.component_clause1 as ComponentClause1;
    const type = componentClause1.type_specifier;
    // force redeclared type to load if it is not already loaded
    typeStore.get(type);
    const redeclareDefinition =
      componentClause1.component_declaration1.declaration;
    const modProps = { ...props, type, definition: redeclareDefinition };
    const redeclareMod = createModification(modProps);
    return redeclareMod;
  } else if ("short_class_definition" in redeclaration) {
  } else if ("element_replaceable" in redeclaration) {
  }
}

function unpackModblock(props: ModificationProps) {
  let mods: Modification[] = [];
  let value: Expression | string = '';
  let { definition, typePath = "", name } = props as ModificationWithDefinition;

  let modBlock = definition;

  modBlock =
    "element_modification_or_replaceable" in definition
      ? definition.element_modification_or_replaceable.element_modification
      : definition;

  if ("name" in modBlock) {
    name = modBlock.name;
  } else if ("identifier" in modBlock) {
    name = modBlock.identifier;
  }

  let modelicaPath = typePath ? `${typePath}.${name}` : "";
  const mod = (modBlock as Mod).modification;
  if (mod) {
    // test if an assignment
    if ("equal" in mod) {
      // simple_expression can potentially be an expression
      // TODO be ready to feed that into Expression generator
      value = getExpression((mod as Assignment).expression);
    } else if (name == "choice") {
      const choiceMod = (mod as ClassMod).class_modification[0] as RedeclareMod;
      if (choiceMod.element_redeclaration) {
        const replaceable = choiceMod.element_redeclaration
          .element_replaceable as ElementReplaceable;
          // TODO: pass this path into `getExpression` and return
          // as a simple expression ('none')
        value = replaceable.component_clause1.type_specifier;
      }
    } else if ("class_modification" in mod) {
      mods = getModificationList(mod as ClassMod, modelicaPath);
    }
  }

  return new Modification(typePath, name, value, mods);
}

/**
 * Factory method that can create a Modification from two approaches:
 *
 * 1. Either a definition blob of JSON
 * 2. name and value are explicitly provided
 *
 * @param props: ModificationProps
 * @returns Modification
 */
export function createModification(
  props: ModificationProps,
): Modification | undefined {
  const mods: Modification[] = [];
  const { definition, value, typePath = "", name } = props;
  const input = typeStore.get(typePath);
  // modelicaPath = basePath ? `${basePath}.${name}` : "";

  if (definition) {
    if ("element_redeclaration" in definition) {
      return unpackRedeclaration(props);
    }

    return unpackModblock(props);
  }

  return new Modification(typePath, name, value, mods);
}

/**
 * Some Modifications need to be referenced, some don't. A modification is a key - value assignmnent,
 * It can either be a singular modification (e.g. a=1) or it can be a modification with nested modifications
 *  (e.g. a redeclare statement)
 *
 * The mod 'name' can be explicitly provided instead of discovered
 */
export class Modification {
  empty = false;
  modelicaPath = "";
  constructor(
    basePath = "",
    public name = "",
    public value: any,
    public mods: Modification[] = [],
  ) {
    this.modelicaPath = basePath ? `${basePath}.${this.name}` : "";

    if (this.modelicaPath) {
      // only register the mod if it has a path
      modStore.set(this.modelicaPath, this);
    }
  }

  // returns a flattened list of all modifications
  getModifications(): Modification[] {
    // provide the base path
    // basePath + name
    const childMods = this.mods.flatMap((m) => m.getModifications());
    return [this, ...childMods];
  }
}
