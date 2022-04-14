import fs from "fs";
import path from "path";

const EXTEND_NAME = "__extend";
// TODO: there are many literals defined in the modelica standard library
// e.g. 'Modelica.Units.SI.PressureDifference'. We'll have to account for these types
// as well
export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

// const store: { [key: string]: any } = {};

class Store {
  _store: Map<string, any> = new Map();

  set(path: string, element: any) {
    this._store.set(path, element);
  }

  get(path: string) {
    return this._store.get(path);
  }
}

const store = new Store();

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
  class_modification: WrappedMod[];
};

type Assignment = {
  equal: boolean;
  expression: {
    simple_expression: string; // JSON deserializable value
  };
};

// Replacable
type WrappedMod = {
  element_modification_or_replaceable: {
    element_modification: Mod;
  };
};

type Mod = {
  name: string;
  modification: ClassMod | WrappedMod | Assignment | RedeclarationMod;
};

type DeclarationBlock = {
  identifier: string;
  modification?: ClassMod | WrappedMod | Assignment | RedeclarationMod;
};

type DescriptionBlock = {
  description_string: string;
  annotation?: any;
};

type Expression = {
  modelicaPath: string;
  expression: string;
};
 
class Modification {
  name?: string;
  value?: string;
  mods: Modification[] = [];
  empty=false; // TODO: we have to unpack things that may not have a modification
  constructor(definition: WrappedMod | Mod | DeclarationBlock) {
    // determine if wrapped
    const modBlock =
      "element_modification_or_replaceable" in definition
        ? definition.element_modification_or_replaceable.element_modification
        : definition;

    if ("name" in modBlock) {
      this.name = modBlock.name;
    } else if ("identifier" in modBlock) {
      this.name = modBlock.identifier;
    }

    const mod = modBlock.modification;

    if (mod) {
      // test if an assignment
      if ("equal" in mod) {
        // TODO: feed this into an expression parser to generate actual expression
        // instances IF there is an expression. If it is a simple value keep the assignment
        this.value = (mod as Assignment).expression.simple_expression;
      } else if ("class_modification" in mod) {
        this.mods = (mod as ClassMod).class_modification.map(
          (m) => new Modification(m),
        );
      } else if ("element_redeclaration" in mod) {
        // element_redeclarations don't have a name
        this.name = "choice";
        this.value = (
          mod as RedeclarationMod
        ).element_redeclaration.component_clause1.type_specifier;
      }
    } else {
      this.empty = true;
    }
  }
}

// TODO: remove this once types are shared between FE and BE
export interface OptionN {
  // id: number;
  type: string;
  name: string;
  modelicaPath: string; //
  options?: OptionN[]; // TODO: flatten references
  group?: string;
  tab?: string;
  value?: any;
  enable?: any;
}

export abstract class Element {
  modelicaPath = "";
  name = "";
  type = "";

  abstract getOptions(): OptionN[];
}

export class Record extends Element {
  elementList: Element[];
  description: string;
  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifer;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = "Record";
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list;
    store.set(this.modelicaPath, this);
  }

  getOptions() {
    return this.elementList.flatMap((el) => el.getOptions());
  }
}

export class Package extends Element {
  elementList: Element[];
  description: string;

  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifer;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list;
  }

  getOptions() {
    return this.elementList.flatMap((el) => el.getOptions());
  }
}

export class Model extends Element {
  elementList: Element[];
  description: string;

  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = this.modelicaPath;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list.map((e: any) =>
      _constructElement(e, this.modelicaPath),
    );
    store.set(this.modelicaPath, this);
  }

  getOptions() {
    return this.elementList.flatMap((el) => el.getOptions());
  }
}

// a parameter with a type
export class Component extends Element {
  modifications: any[] = [];
  type = ""; // modelica path
  value: any; // TODO
  description = "";
  annotation: any[] = [];
  tab? = "";
  group? = "";
  enable: Expression = { expression: "", modelicaPath: "" };

  constructor(definition: any, basePath: string) {
    super();
    const componentClause = definition.component_clause;
    const declarationBlock = componentClause.component_list.find(
      (c: any) => "declaration" in c,
    ).declaration as DeclarationBlock;
    this.name = declarationBlock.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;

    this.type = componentClause.type_specifier;
    const descriptionBlock = componentClause.component_list.find(
      (c: any) => "description" in c,
    )?.description;

    if (descriptionBlock) {
      this.description = descriptionBlock?.description_string || "";
      this.annotation = descriptionBlock?.annotation;
      if (this.annotation) {
        this._setUIInfo(this.annotation);
      }
    }

    const mod = declarationBlock.modification
      ? new Modification(declarationBlock)
      : null;

    if (mod && !mod.empty) {
      this.value = mod.value;
    }

    // if type is a literal type we can convert it from a string
    if (MODELICA_LITERALS.includes(this.type) && this.value !== undefined) {
      this.value = JSON.parse(this.value);
    }

    store.set(this.modelicaPath, this);
  }

  /**
   * Sets tab and group if found
   * assigns 'enable' expression
   */
  _setUIInfo(annotation: (Mod | WrappedMod)[]) {
    const mods = annotation.map((mod) => new Modification(mod));

    const dialog = mods.find((m) => m.name === "Dialog");
    if (dialog) {
      const group = dialog.mods.find((m) => m.name === "group")?.value;
      const tab = dialog.mods.find((m) => m.name === "tab")?.value;
      const expression = dialog.mods.find((m) => m.name === "enable")?.value;

      this.group = (group) ? JSON.parse(group) : "";
      this.tab = (tab) ? JSON.parse(tab) : "";

      this.enable = {
        modelicaPath: this.modelicaPath,
        expression: expression || "",
      };
    }
  }

  getOptions() {
    const option: OptionN = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      group: this.group,
      tab: this.tab,
      enable: this.enable
    };
    const typeInstance = store.get(this.type) || null;

    if (typeInstance) {
      option.options = typeInstance.getOptions();
    }

    return [option];
  }
}

export class Replaceable extends Component {
  choices: { type: string; description: string }[] = [];
  constructor(definition: any, basePath: string) {
    super(definition, basePath);

    // the default value is original type provided
    this.value = this.type;

    // TODO: switch choices extraction to use 'Mod' class
    // extract choices from the annotation
    const choicesBlock = this.annotation.find(
      (entry: any) =>
        entry?.element_modification_or_replacable?.element_modification
          ?.name === "choices",
    )?.element_modification_or_replacable?.element_modification;

    if (choicesBlock) {
      // iterate through each modification and get the choice
      const choiceList = choicesBlock.modification.class_modification;
      choiceList.map((c: any) => {
        const [choiceMod, ..._rest] =
          c.element_modification_or_replacable.element_modification
            .class_modification;
        const componentClause =
          choiceMod.elementredeclaration.component_clause1;
        const type = componentClause.type_specifier;
        const description =
          componentClause.component_declaration1.description.description_string;

        this.choices.push({ type, description });
      });
    }
  }

  getOptions() {
    const option: OptionN = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      options: [],
    };

    this.choices.map((c) => {
      const typeInstance = store.get(c.type) || null;
      if (typeInstance) {
        option.options?.push(...typeInstance.getOptions());
      }
    });

    return [option];
  }
}

export class Enum extends Element {
  enumList: {
    modelicaPath: string;
    identifier: string;
    description: string;
  }[] = [];
  description: string = "";

  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.short_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = "Enum";
    this.enumList = specifier.value.enum_list;
    this.description = specifier.value.description.description_string;
    store.set(this.modelicaPath, this);

    specifier.value.enum_list.map(
      (e: {
        identifier: string;
        description: { description_string: string };
      }) => {
        const modelicaPath = `${this.modelicaPath}.${e.identifier}`;
        const identifier = e.identifier;
        const description = e.description.description_string;
        this.enumList.push({ modelicaPath, identifier, description });
      },
    );
  }

  getOptions() {
    // outputs a parent option, then an option for each enum type
    const optionList: any = this.enumList.map((e) => ({
      modelicaPath: e.modelicaPath,
      name: e.description,
      type: this.type,
      options: null,
    }));

    return optionList;
  }
}

// TODO: this almost entirely overlaps with 'Component'
export class ExtendClause extends Element {
  modifications: any[] = [];
  type: string; // modelica path
  constructor(definition: any, basePath: string) {
    super();
    this.name = "__extend"; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${definition.extends_clause.name}`;
    this.type = definition.extends_clause.name;

    store.set(this.modelicaPath, this);
  }

  getOptions() {
    const typeInstance = store.get(this.type);
    return typeInstance ? typeInstance.getOptions() : []; // TODO: return options from store
  }
}

/**
 * Given a list of elements, discovers and returns the formatted type
 *
 * @param definition
 * @param basePath
 * @returns
 */
function _constructElement(
  definition: any,
  basePath: string,
): Element | undefined {
  const extend = "extends_clause";
  const component = "component_clause";

  // either the element type is defined ('type', 'model', 'package', or 'record') or
  // 'extend_clause' or 'component_clause' is provided
  let elementType = null;
  if ("class_prefixes" in definition) {
    elementType = definition.class_prefixes;
  } else if (extend in definition) {
    elementType = extend;
  } else if (component in definition) {
    elementType = component;
  }

  switch (elementType) {
    case "type":
      return new Enum(definition, basePath);
    case "model":
      return new Model(definition, basePath);
    case "package":
      return new Package(definition, basePath);
    case "record":
      return new Record(definition, basePath);
    case extend:
      return new ExtendClause(definition, basePath);
    case component:
      return new Component(definition, basePath);
  }
}

//
export class File {
  public modelicaPath = ""; // only important part of a file
  public entries: Element[] = [];
  constructor(obj: any) {
    this.modelicaPath = obj.within;
    obj.class_definition.map((cd: any) => {
      const element = _constructElement(cd, this.modelicaPath);
      if (element) {
        this.entries.push(element);
      }
    });
  }
}

// Extracts models/packages
export const getFile = (filePath: string) => {
  const templateString = fs.readFileSync(filePath, { encoding: "utf8" });

  return new File(JSON.parse(templateString));
};
