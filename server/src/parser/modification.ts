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
  return classMod.class_modification.map(
    (m) => new Modification(m as WrappedMod, modelicaPath, name),
  );
}

/**
 * Some Modifications need to be referenced, some don't. A modification is a key - value assignmnent,
 * It can either be a singular modification (e.g. a=1) or it can be a modification with nested modifications
 *  (e.g. a redeclare statement)
 *
 * The mod 'name' can be explicitly provided instead of discovered
 */
export class Modification {
  name?: string;
  value?: string;
  mods: Modification[] = [];
  empty = false;
  modelicaPath = "";
  constructor(
    definition: WrappedMod | Mod | DeclarationBlock,
    basePath = "",
    name = "",
  ) {
    // determine if wrapped
    const modBlock =
      "element_modification_or_replaceable" in definition
        ? definition.element_modification_or_replaceable.element_modification
        : definition;

    const mod = modBlock.modification;

    if (name) {
      this.name = name;
    } else if ("name" in modBlock) {
      this.name = modBlock.name;
    } else if ("identifier" in modBlock) {
      this.name = modBlock.identifier;
    }

    // name gets duplicated for 'class'
    this.modelicaPath = basePath ? `${basePath}.${this.name}` : "";

    if (mod) {
      // test if an assignment
      if ("equal" in mod) {
        // simple_expression can potentially be an expression
        // TODO be ready to feed that into Expression generator
        this.value = (mod as Assignment).expression.simple_expression;
      } else if (this.name == "choice") {
        // element_redeclarations
        // choice has the following structure:
        // ClassMod -> RedeclarationMod
        const choiceMod = (mod as ClassMod)
          .class_modification[0] as RedeclarationMod;
        this.value =
          choiceMod.element_redeclaration.component_clause1.type_specifier;
      } else if ("class_modification" in mod) {
        // const type = "";
        this.mods = getModificationList(mod as ClassMod, this.modelicaPath);
      }
    } else {
      this.empty = true;
    }
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
