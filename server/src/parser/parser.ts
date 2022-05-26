/**
 * The parser extracts modelica-json with the goal of finding each point of 'input' in modelica-json.
 * Various structures in modelica are generically converted to 'elements', with each specific structure
 * implemented as a class that extends the 'Element' base class.
 *
 * The parser also keeps a store of type definitions, so that as json is unpacked and converted to an 'Element'
 * that element is available if referenced by another piece of modelica-json.
 */

import { findPackageEntryPoints, loader, TEMPLATE_IDENTIFIER } from "./loader";
import { Template } from "./template";
import {
  createModification,
  Mod,
  Modification,
  WrappedMod,
  Expression,
  DeclarationBlock,
  getModificationList,
} from "./modification";

const EXTEND_NAME = "__extend";
// TODO: templates *should* have all types defined within a template - however there will
// be upcoming changes once unit changes are supported
export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

class Store {
  _store: Map<string, any> = new Map();

  set(path: string, element: Element) {
    this._store.set(path, element);
  }

  /**
   * TODO: This 'get' needs to match the lookup behavior for modelica type references
   * where it is able to follow an order of searching based on the type. Full rules
   * are defined here: https://mbe.modelica.university/components/packages/lookup/
   *
   * For now this does two types of lookup:
   * 1. Try the path as an absolute path
   * 2. Try it as a relative path (context + path)
   *
   * @param path
   * @param context
   * @returns
   */
  get(path: string, context = ""): Element | undefined {
    if (MODELICA_LITERALS.includes(path)) {
      return; // PUNCH-OUT! literals don't have a type definition
    }

    const paths = context ? [path, `${context}.${path}`] : [path];

    // for each path
    // check if either is in the store
    const typeDef = this._store.has(path)
      ? this._store.get(path)
      : this._store.get(`${context}.${path}`);

    if (typeDef) {
      return typeDef; // PUNCH-OUT!
    }

    // not found, attempt to load from json
    for (const p of paths) {
      try {
        const file = getFile(p);
        if (file) {
          assertType(p);
          return this._store.get(p);
        }
      } catch (e) {
        // not found
      }
    }
  }

  has(path: string): boolean {
    return this._store.has(path);
  }
}

export const typeStore = new Store();

function assertType(type: string) {
  if (!MODELICA_LITERALS.includes(type) && !typeStore.has(type)) {
    throw new Error(`${type} not defined`);
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
  final?: boolean;
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
    if (this.description === 'Partial component with two ports') {
      console.log("yep");
    }

    this.elementList = specifier.composition.element_list.map((e: any) =>
      _constructElement(e, this.modelicaPath),
    );

    this.annotation = specifier.composition.annotation?.map(
      (m: Mod | WrappedMod) => createModification({ definition: m }),
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
    // A group with no elementList is ignorecd
    if (this.elementList.length === 0) {
      return {};
    }

    const children = this.elementList.filter(
      (el) => Object.keys(el.getOptions()).length > 0,
    );

    const option: OptionN = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      name: this.description,
      options: children.map((c) => c.modelicaPath),
    };

    let options: { [key: string]: OptionN } = { [option.modelicaPath]: option };

    children.map((el) => {
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
          (mod: Mod | WrappedMod) => createModification({ definition: mod }),
        );
        this._setUIInfo();
      }
    }

    this.mod = declarationBlock.modification
      ? createModification({
          definition: declarationBlock,
          basePath,
          name: this.name,
        })
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
      final: this.final,
    };

    let options = { [option.modelicaPath]: option };

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
    const typeInstance = typeStore.get(this.type);
    const typeInstanceMods = typeInstance
      ? typeInstance.getModifications()
      : [];
    const paramMods =
      this.mod && !this.mod.empty ? this.mod.getModifications() : [];
    // TODO: If there are duplicate mods (by modelica path) paramMods should
    // overwrite typeInstance mods
    // TODO: a param might point to a classmod, it would be better
    // to not put that modification in the list
    return [...paramMods, ...typeInstanceMods];
  }
}

export class ReplaceableInput extends Input {
  choices: string[] = [];
  constraint: Element | undefined;
  mods: Modification[] = [];
  constructor(definition: any, basePath: string) {
    super(definition, basePath);

    // the default value is original type provided
    this.value = this.type;

    this.mods.push(
      createModification({
        name: this.name,
        value: this.value,
        basePath: basePath,
      }),
    );

    // modifiers for replaceables are specified in a constraining
    // interface. Check if one is present to extract modifiers
    if (definition.constraining_clause) {
      const constraintDef = definition.constraining_clause;
      this.constraint = typeStore.get(constraintDef.name);
      this.mods = constraintDef?.class_modification
        ? [
            ...this.mods,
            ...getModificationList(constraintDef, this.modelicaPath),
          ]
        : [];
    }

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

  getModifications(): Modification[] {
    const constraintMods = this.constraint
      ? this.constraint.getModifications()
      : [];
    const replaceableMods: Modification[] = [];

    this.choices.map((c) => {
      const typeInstance = typeStore.get(c) || null;
      if (typeInstance) {
        replaceableMods.push(...typeInstance.getModifications());
      }
    });

    return [...this.mods, ...constraintMods, ...replaceableMods];
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
  mods: Modification[] = [];
  type: string;
  value: string;
  constructor(definition: any, basePath: string) {
    super();
    this.name = EXTEND_NAME; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${this.name}`;
    typeStore.set(this.modelicaPath, this);
    this.type = definition.extends_clause.name;
    this.value = this.type;
    if (definition.extends_clause.class_modification) {
      this.mods = getModificationList(
        definition.extends_clause,
        this.modelicaPath,
      );
    }
  }

  getOptions(recursive = true) {
    const typeInstance = typeStore.get(this.type) as Element;

    if (typeInstance) {
      const childOptions = Object.keys(typeInstance.getOptions(false));
      if (childOptions.length === 0) {
        return {};
      }

      const option: OptionN = {
        modelicaPath: this.modelicaPath,
        type: this.type,
        value: this.value,
        name: typeInstance.name,
        options: [this.type],
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
    return this.mods ? this.mods.flatMap((m) => m.getModifications()) : [];
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
