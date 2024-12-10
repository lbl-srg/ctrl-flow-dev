/*

Manually created interfaces to match the output of the modelica-json tool

*/

export interface ClassModification {
  element_modification_or_replaceable: {
    each: boolean;
    final: boolean;
    element_modification: {
      name: string;
      modification: any; // modification
      "description-string": string;
    };
    element_replaceable: any;
  };
}

export interface ShortClassSpecifier {
  identifier: string;
  short_class_specifier_value: {
    base_prefix: string;
    name: string;
    array_subscripts: any;
    class_modification: any;
    description: any;
    enum_list: [
      {
        identifier: string;
        description: any;
      },
    ];
  };
}

export interface ImportClause {
  identifier: string;
  name: string;
}

export interface ExtendClause {
  name: string;
  class_modification: ClassModification;
  annotation: ClassModification;
}

export interface ElementSection {
  public_element_list: Array<Element>;
  protected_element_list: Array<Element>;
  equation_section: any;
  algorithm_section: any;
}

export interface LongClassSpecifier {
  identifier: string;
  description_string: string;
  composition: {
    element_list: Array<Element>;
    element_sections: Array<ElementSection>;
  };
}

export interface Description {
  description_string: string;
  annotation: Array<ClassModification>;
}

export interface DerClassSpecifier {
  identifier: string;
  der_class_specifier_value: {
    type_specifier: string;
    identifier: Array<string>;
    description: Description;
  };
}

// See https://github.com/lbl-srg/modelica-json/issues/239
// We define here ClassDefinition as an object (not as an array), consistently with the grammar.
export interface ClassDefinition {
  final: boolean;
  encapsulated: boolean;
  class_prefixes: string;
  class_specifier: {
    long_class_specifier?: LongClassSpecifier;
    short_class_specifier?: ShortClassSpecifier;
    der_class_specifier?: DerClassSpecifier;
  };
}

export interface Component {
  declaration: DeclarationBlock;
  condition_attribute: {
    expression: any;
  };
  description: Description;
}

export interface ComponentClause {
  type_prefix: string; // [ flow | stream ] [ discrete | parameter | constant ] [ input | output ]
  type_specifier: string;
  array_subscripts: any;
  component_list: Array<Component>;
}

export interface Element {
  import_clause: ImportClause;
  extends_clause: ExtendClause;
  redeclare: boolean;
  final: boolean;
  inner: boolean;
  outer: boolean;
  replaceable: boolean;
  constraining_clause: {
    name: string;
    class_modification: Array<ClassModification>;
  };
  class_definition: ClassDefinition;
  component_clause: ComponentClause;
  description: Description;
}


export type ExtendsClause = {
  extends_clause: ClassMod;
  name: string;
}

export type ConstraintDef = {
  name: string;
  class_modification: ClassMod;
}

export type DeclarationBlock = {
  identifier: string;
  modification?: ClassMod | WrappedMod | Assignment | RedeclareMod;
};

export type DescriptionBlock = {
  description_string: string;
  annotation?: any;
};

export type ComponentDeclaration1 = {
  declaration: DeclarationBlock;
  description?: DescriptionBlock;
};

export type ComponentClause1 = {
  type_specifier: string; // Modelica Path
  component_declaration1: ComponentDeclaration1;
};

export type ShortClassDefinition = {
  class_prefixes: string; // //(PARTIAL)? (CLASS | MODEL | (OPERATOR)? RECORD | BLOCK | (EXPANDABLE)? CONNECTOR | TYPE | PACKAGE | ((PURE | IMPURE))? (OPERATOR)? FUNCTION | OPERATOR),
  short_class_specifier: ShortClassSpecifier; // from 'parser.ts'
};

export type ElementReplaceable = {
  component_clause1: ComponentClause1;
  short_class_definition: ShortClassDefinition;
  constraining_clause: ConstraintDef;
};

export type RedeclareMod = {
  element_redeclaration: {
    each: boolean;
    final: boolean;
    short_class_definition?: ShortClassDefinition;
    element_replaceable?: ElementReplaceable;
    component_clause1?: ComponentClause1;
  };
};

export type ClassMod = {
  class_modification: (WrappedMod | RedeclareMod)[];
  name: string;
};

export type Assignment = {
  equal: boolean;
  expression: {
    simple_expression: string; // JSON deserializable value
  };
};

// Replacable
export type WrappedMod = {
  element_modification_or_replaceable: {
    element_modification: Mod;
    final: boolean;
    each: boolean;
    element_replaceable: ElementReplaceable;
  };
};

export type Mod = {
  name: string;
  modification: ClassMod | WrappedMod | Assignment | RedeclareMod;
};
