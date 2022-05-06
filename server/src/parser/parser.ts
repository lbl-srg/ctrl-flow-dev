import { findPackageEntryPoints, loader, TEMPLATE_IDENTIFIER } from "./loader";
import { Template } from "./template";

const EXTEND_NAME = "__extend";
// TODO: templates *should* have all types defined within a template - however there will
// be upcoming changes once unit changes are supported
export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

class Store {
  _store: Map<string, any> = new Map();

  set(path: string, element: Element) {
    this._store.set(path, element);
  }

  get(path: string): Element | undefined {
    // startsWith("Modelica"): Templates *should* have all types defined within
    // a template so we do not need to rely on definitionals in the modelica standard library
    if (!MODELICA_LITERALS.includes(path) && !path.startsWith("Modelica")) {
      if (!this._store.has(path)) {
        getFile(path);
      }
      assertType(path);
      return this._store.get(path);
    }
  }

  has(path: string): boolean {
    return this._store.has(path);
  }
}

export const typeStore = new Store();

const modStore: Map<string, Modification> = new Map();

function assertType(type: string) {
  if (
    !MODELICA_LITERALS.includes(type) &&
    !typeStore.has(type) &&
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

/**
 * Some Modifications need to be referenced, some don't. A modification is a key - value assignmnent,
 * It can either be a singular modification (e.g. a=1) or it can be a modification with nested modifications
 *  (e.g. a redeclare statement)
 *
 * The mod 'name' can be explicitly provided instead of discovered
 */
class Modification {
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

    if (name) {
      this.name = name;
    } else if ("name" in modBlock) {
      this.name = modBlock.name;
    } else if ("identifier" in modBlock) {
      this.name = modBlock.identifier;
    }

    this.modelicaPath = basePath ? `${basePath}.${this.name}` : "";
    const mod = modBlock.modification;

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
        this.mods = (mod as ClassMod).class_modification.map(
          (m) => new Modification(m as WrappedMod, this.modelicaPath),
        );  
      }
    } else {
      this.empty = true;
    }
    if (this.modelicaPath) {
      // only register the mod if it has a path
      modStore.set(this.modelicaPath, this);
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
  description = "";
  entryPoint = false;

  abstract getOptions(recursive?: boolean): { [key: string]: OptionN };

  // 'Input' and 'InputGroup' and 'Extend' returns modifications and override
  // this method. Other elements do not have a modification
  getModifications(): Modification[] {
    return [];
  }
}

export class InputGroup extends Element {
  annotation: Modification[];
  elementList: Element[];
  description: string;
  entryPoint = false;
  mod: Modification | undefined;

  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = basePath ? [basePath, this.name].join(".") : this.name;
    typeStore.set(this.modelicaPath, this);
    this.type = this.modelicaPath;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list.map((e: any) =>
      _constructElement(e, this.modelicaPath),
    );

    this.annotation = specifier.composition.annotation?.map(
      (m: Mod | WrappedMod) => new Modification(m),
    );
    if (
      this.annotation &&
      this.annotation.find((m) => m.name === TEMPLATE_IDENTIFIER)
    ) {
      this.entryPoint = true;
      if (definition.class_prefixes === "model") {
        new Template(this);
      }
    }
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

  getModifications() {
    return this.elementList.flatMap((e) => e.getModifications());
  }
}

// a parameter with a type
export class Input extends Element {
  mod: Modification | null;
  type = ""; // modelica path
  value: any; // modelica path?
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
    typeStore.set(this.modelicaPath, this);
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

    this.mod = declarationBlock.modification
      ? new Modification(declarationBlock, this.modelicaPath)
      : null;

    if (this.mod && !this.mod.empty) {
      this.value = this.mod.value;
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
      const typeInstance = typeStore.get(this.type) || null;
      if (typeInstance) {
        const childOptions = typeInstance.getOptions((recursive = false));
        option.options = Object.keys(childOptions);
        options = { ...options, ...typeInstance.getOptions() };
      }
    }

    return options;
  }

  getModifications(): Modification[] {
    return this.mod && !this.mod.empty ? [this.mod] : [];
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
        const typeInstance = typeStore.get(c) || null;
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
    typeStore.set(this.modelicaPath, this);

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
  mod: Modification | undefined;
  type: string;
  value: string;
  constructor(definition: any, basePath: string) {
    super();
    this.name = EXTEND_NAME; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${this.name}`;
    typeStore.set(this.modelicaPath, this);
    this.type = definition.extends_clause.name;
    this.value = this.type;
    this.mod = new Modification(
      definition.extends_clause,
      this.modelicaPath,
      this.name,
    );
  }

  getOptions(recursive = true) {
    const typeInstance = typeStore.get(this.type) as Element;
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

  getModifications() {
    return this.mod ? [this.mod] : [];
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
  public package = ""; // only important part of a file
  public elementList: Element[] = [];
  constructor(obj: any, filePath: string) {
    this.package = obj.within;
    const splitFilePath = filePath.split(".");
    if (this.package) {
      // Check that each portion of the within path matches the file path
      // a mismatch means an incorrectly typed or structured package
      // Folder and file should always line up, e.g.
      // TestPackage/Interface/stuff.mo should have a within path of 'TestPackage.Interface'
      this.package.split(".").forEach((value, index) => {
        if (index < splitFilePath.length && value !== splitFilePath[index]) {
          throw new Error(
            "Malformed Modelica Package or Incorrect type assigned",
          );
        }
      });
    }

    obj.class_definition.map((cd: any) => {
      const element = _constructElement(cd, this.package);
      if (element) {
        this.elementList.push(element);
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

// Searches a package for templates, then loads the file
// creating template instances
export const loadPackage = (filePath: string) => {
  const paths = findPackageEntryPoints(pathPrefix, filePath);

  paths?.map(({ json, path }) => new File(json, path));
};
