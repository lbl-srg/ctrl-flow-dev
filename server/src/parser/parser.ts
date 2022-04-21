import fs from "fs";
import path from "path";
import loader from "./loader";

const EXTEND_NAME = "__extend";
// TODO: templates *should* have all types defined within a template - however there will
// be upcoming changes once unit changes are supported
export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

// const store: { [key: string]: any } = {};

class Store {
  _store: Map<string, any> = new Map();

  set(path: string, element: Element) {
    this._store.set(path, element);
  }

  get(path: string): Element | undefined {
    if (!MODELICA_LITERALS.includes(path)) {
      if (!this._store.has(path)) {
        try {
          getFile(path);
        } catch (error) {
          throw new Error(`Unable to find type ${path}`);
        }
      }
      assertType(path);
      return this._store.get(path);
    }
  }

  has(path: string): boolean {
    return this._store.has(path);
  }
}

const store = new Store();

function assertType(type: string) {
  if (
    !MODELICA_LITERALS.includes(type) &&
    !store.has(type) &&
    !type.startsWith("Modelica")
  ) {
    throw new Error(`${type} not defined`);
  }
}

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
  empty = false;
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
      } else if (this.name == "choice") {
        // element_redeclarations
        // choice has the following structure:
        // ClassMod -> RedeclarationMod
        const choiceMod = (mod as ClassMod)
          .class_modification[0] as RedeclarationMod;
        this.value =
          choiceMod.element_redeclaration.component_clause1.type_specifier;
      } else if ("class_modification" in mod) {
        this.mods = (mod as ClassMod).class_modification.map(
          (m) => new Modification(m as WrappedMod),
        );
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
  modelicaPath: string;
  options?: string[];
  group?: string;
  tab?: string;
  value?: any;
  valueExpression?: any;
  enable?: any;
}

export abstract class Element {
  modelicaPath = "";
  name = "";
  type = "";

  abstract getOptions(recursive?: boolean): { [key: string]: OptionN };
}

export class InputGroup extends Element {
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

  getOptions(recursive = true) {
    const option: OptionN = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      name: this.description,
    };

    let options: { [key: string]: OptionN } = { [option.modelicaPath]: option };

    this.elementList.map((el) => {
      options = { ...options, ...el.getOptions(recursive) };
    });

    return options;
  }
}

// a parameter with a type
export class Input extends Element {
  modifications: any[] = [];
  type = ""; // modelica path
  value: any;
  description = "";
  final = false;
  annotation: Modification[] = [];
  tab? = "";
  group? = "";
  enable: Expression = { expression: "", modelicaPath: "" };
  valueExpression: Expression = { expression: "", modelicaPath: "" };

  constructor(definition: any, basePath: string) {
    super();
    const componentClause = definition.component_clause;
    const declarationBlock = componentClause.component_list.find(
      (c: any) => "declaration" in c,
    ).declaration as DeclarationBlock;
    this.name = declarationBlock.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.final = definition.final ? definition.final : this.final;

    this.type = componentClause.type_specifier;

    // description block (where the annotation is) can be in different locations
    // constrainby changes this location
    const descriptionBlock =
      componentClause.component_list.find((c: any) => "description" in c)
        ?.description || definition["description"];

    if (descriptionBlock) {
      this.description = descriptionBlock?.description_string || "";
      if (descriptionBlock?.annotation) {
        this.annotation = descriptionBlock.annotation.map(
          (mod: Mod | WrappedMod) => new Modification(mod),
        );
        this._setUIInfo();
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
      try {
        this.value = JSON.parse(this.value);
      } catch (error) {
        if (error instanceof SyntaxError) {
          // if parsing the value fails assume an expression
          this.valueExpression = {
            expression: this.value,
            modelicaPath: this.modelicaPath,
          };
          this.value = null;
        } else {
          throw error;
        }
      }
    }

    store.set(this.modelicaPath, this);
  }

  /**
   * Sets tab and group if found
   * assigns 'enable' expression
   */
  _setUIInfo() {
    const dialog = this.annotation.find((m) => m.name === "Dialog");
    if (dialog) {
      const group = dialog.mods.find((m) => m.name === "group")?.value;
      const tab = dialog.mods.find((m) => m.name === "tab")?.value;
      const expression = dialog.mods.find((m) => m.name === "enable")?.value;

      this.group = group ? JSON.parse(group) : "";
      this.tab = tab ? JSON.parse(tab) : "";

      this.enable = {
        modelicaPath: this.modelicaPath,
        expression: expression || "",
      };
    }
  }

  getOptions(recursive = true) {
    const option: OptionN = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      group: this.group,
      tab: this.tab,
      valueExpression: this.valueExpression,
      enable: this.enable,
    };

    let options = this.final ? {} : { [option.modelicaPath]: option };

    if (recursive) {
      const typeInstance = store.get(this.type) || null;
      if (typeInstance) {
        const childOptions = typeInstance.getOptions((recursive = false));
        option.options = Object.keys(childOptions);
        options = { ...options, ...typeInstance.getOptions() };
      }
    }

    return options;
  }
}

export class ReplaceableInput extends Input {
  choices: string[] = [];
  constructor(definition: any, basePath: string) {
    super(definition, basePath);

    // the default value is original type provided
    this.value = this.type;

    const choices = this.annotation.find(
      (m) => m.name === "choices",
    ) as Modification;

    if (choices) {
      choices.mods.map((choice) => {
        if (choice.value) {
          this.choices.push(choice.value as string);
        } else {
          throw new Error("Malformed 'Choices' specified");
        }
      });
    }
  }

  getOptions(recursive = true) {
    const option: OptionN = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      options: this.choices,
      group: this.group,
      tab: this.tab,
    };

    let options = { [option.modelicaPath]: option };
    if (recursive) {
      this.choices.map((c) => {
        const typeInstance = store.get(c) || null;
        if (typeInstance) {
          options = { ...options, ...typeInstance.getOptions() };
        }
      });
    }

    return options;
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
    this.type = this.modelicaPath;
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

  getOptions(recursive = true) {
    const options: { [key: string]: OptionN } = {};
    // outputs a parent option, then an option for each enum type
    const optionList: OptionN[] = this.enumList.map(
      (e) =>
        (options[e.modelicaPath] = {
          modelicaPath: e.modelicaPath,
          name: e.description,
          type: this.type,
          value: e.modelicaPath,
        }),
    );

    return options;
  }
}

// Inherited properties by type with modifications
export class InputGroupExtend extends Element {
  modifications: any[] = [];
  type: string;
  value: string;
  constructor(definition: any, basePath: string) {
    super();
    this.name = "__extend"; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = definition.extends_clause.name;
    this.value = this.type;

    store.set(this.modelicaPath, this);
  }

  getOptions(recursive = true) {
    const typeInstance = store.get(this.type) as Element;
    if (typeInstance) {
      const option: OptionN = {
        modelicaPath: this.modelicaPath,
        type: this.type,
        value: this.value,
        name: typeInstance.name,
      };
      return {
        ...{ [option.modelicaPath]: option },
        ...typeInstance.getOptions(recursive),
      };
    } else {
      return {};
    }
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
  const replaceable = "replaceable";

  definition =
    "class_definition" in definition ? definition.class_definition : definition;
  // either the element type is defined ('type', 'model', 'package', or 'record') or
  // 'extend_clause' or 'component_clause' is provided
  let elementType = null;
  if ("class_prefixes" in definition) {
    elementType = definition.class_prefixes;
  } else if (extend in definition) {
    elementType = extend;
  } else if (replaceable in definition && definition.replaceable) {
    elementType = replaceable;
  } else if (component in definition) {
    elementType = component;
  }

  switch (elementType) {
    case "type":
      return new Enum(definition, basePath);
    case "model":
    case "partial model":
    case "record":
    case "package":
      return new InputGroup(definition, basePath);
    case extend:
      return new InputGroupExtend(definition, basePath);
    case component:
      return new Input(definition, basePath);
    case replaceable:
      return new ReplaceableInput(definition, basePath);
  }
}

//
export class File {
  public modelicaPath = ""; // only important part of a file
  public entries: Element[] = [];
  constructor(obj: any, filePath: string) {
    this.modelicaPath = obj.within;

    // Check that each portion of the within path matches the file path
    // a mismatch means an incorrectly typed or structured package
    // Folder and file should always line up, e.g.
    // TestPackage/Interface/stuff.mo should have a within path of 'TestPackage.Interface'
    const splitFilePath = filePath.split(".");
    this.modelicaPath.split(".").forEach((value, index) => {
      if (value !== splitFilePath[index]) {
        throw new Error(
          "Malformed Modelica Package or Incorrect type assigned",
        );
      }
    });
    obj.class_definition.map((cd: any) => {
      const element = _constructElement(cd, this.modelicaPath);
      if (element) {
        this.entries.push(element);
      }
    });
  }
}

let pathPrefix = "";
export function setPathPrefix(prefix: string) {
  pathPrefix = prefix;
}
// Extracts models/packages
export const getFile = (filePath: string) => {
  const jsonData = loader(pathPrefix, filePath);
  if (jsonData) {
    return new File(jsonData, filePath);
  }
};
