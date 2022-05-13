const modStore: Map<string, Modification> = new Map();

type RedeclarationMod = {
  element_redeclaration: {
    component_clause1: {
      type_specifier: string; // Modelica Path
      component_declaration1: {
        declaration: DeclarationBlock;
        description: DescriptionBlock;
      };
    };
  };
};

type ClassMod = {
  class_modification: (WrappedMod | RedeclarationMod)[];
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
  modification: ClassMod | WrappedMod | Assignment | RedeclarationMod;
};

export type DeclarationBlock = {
  identifier: string;
  modification?: ClassMod | WrappedMod | Assignment | RedeclarationMod;
};

export type DescriptionBlock = {
  description_string: string;
  annotation?: any;
};

export type Expression = {
  modelicaPath: string;
  expression: string;
};

export function getModificationList(
  classMod: ClassMod,
  modelicaPath: string,
  name = "",
): Modification[] {
  return classMod.class_modification.map((m) =>
    createModification({
      definition: m as WrappedMod,
      basePath: modelicaPath,
      name: name,
    }),
  );
}

interface ModificationBasics {
  basePath?: string;
  name?: string;
  value?: any;
  definition?: any;
}

interface ModificationWithDefinition extends ModificationBasics {
  definition: WrappedMod | Mod | DeclarationBlock;
  value?: never;
}

interface ModificationWithValue extends ModificationBasics {
  definition?: never;
  value: any;
  name: string;
}

type ModificationProps = ModificationWithDefinition | ModificationWithValue;

/**
 * Factory method that can create a Modification from two approaches:
 *
 * 1. Either a definition blob of JSON
 * 2. name and value are explicitly provided
 *
 * @param props: ModificationProps
 * @returns Modification
 */
export function createModification(props: ModificationProps): Modification {
  let mods: Modification[] = [];
  let { definition, value, basePath = "", name } = props;
  let modelicaPath = basePath ? `${basePath}.${name}` : "";

  if (definition) {
    const modBlock =
      "element_modification_or_replaceable" in definition
        ? definition.element_modification_or_replaceable.element_modification
        : definition;

    if ("name" in modBlock) {
      name = modBlock.name;
    } else if ("identifier" in modBlock) {
      name = modBlock.identifier;
    }

    const mod = modBlock.modification;
    if (mod) {
      // test if an assignment
      if ("equal" in mod) {
        // simple_expression can potentially be an expression
        // TODO be ready to feed that into Expression generator
        value = (mod as Assignment).expression.simple_expression;
      } else if (name == "choice") {
        const choiceMod = (mod as ClassMod)
          .class_modification[0] as RedeclarationMod;
        value =
          choiceMod.element_redeclaration.component_clause1.type_specifier;
      } else if ("class_modification" in mod) {
        // const type = "";
        mods = getModificationList(mod as ClassMod, modelicaPath);
      }
    }
  }

  return new Modification(basePath, name, value, mods);
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
