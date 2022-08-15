/**
 * The parser extracts modelica-json with the goal of finding each point of 'input' in modelica-json.
 * Various structures in modelica are generically converted to 'elements', with each specific structure
 * implemented as a class that extends the 'Element' base class.
 *
 * The parser also keeps a store of type definitions, so that as json is unpacked and converted to an 'Element'
 * that element is available if referenced by another piece of modelica-json.
 */

 // TODO: Fix any typings unless any is really necessary

import { findPackageEntryPoints, loader, TEMPLATE_IDENTIFIER } from "./loader";
import { Template } from "./template";
import {
  createModification,
  Mod,
  Modification,
  WrappedMod,
  // Expression,
  DeclarationBlock,
  getModificationList,
} from "./modification";

import { Literal, evaluateExpression } from "./expression";
import * as mj from "./mj-types";

export const EXTEND_NAME = "__extend";
// TODO: templates *should* have all types defined within a template - however there will
// be upcoming changes once unit changes are supported
export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

class Store {
  _store: Map<string, any> = new Map();

  set(path: string, element: Element): boolean {
    if (!this.has(path)) {
      this._store.set(path, element);
      return true;
    }
    return false;
  }

  /**
   * Attempts to 'get the specified modelica path and if not found attempts
   * to load additional json files to parse and populate the type store.
   *
   * @exception if a provided path is not found in the expected file/model!
   */
  get(path: string, context = "", load = true): Element | undefined {
    if (MODELICA_LITERALS.includes(path)) {
      return; // PUNCH-OUT! literals don't have a type definition
    }

    const paths = this._generatePaths(path, context);

    // for each path
    // check if either is in the store
    for(const p of paths) {
      if (this._store.has(p)) {
        return this._store.get(p)
      }
    }

    if (load) {
      return this._load(paths);
    }
  }

  /**
   * Generates all the potential paths that a given path might reference
   * For now this does two types of lookup:
   * 1. Try the path as an absolute path
   * 2. Try it as a relative path (context + path)
   * 
   * 
   * TODO: This needs to match the lookup behavior for modelica type references
   * where it is able to follow an order of searching based on the type. Full rules
   * are defined here: https://mbe.modelica.university/components/packages/lookup/
   *
   */ 
  _generatePaths(path:string, context:string): Array<string> {
    return context ? [path, `${context}.${path}`] : [path];
  }

  _load(paths: Array<string>) {
    // debug var for logging variables that are not found
    let typeFound = false;
    // not found, attempt to load from json
    for (const p of paths) {
      const file = getFile(p);
      if (file) {
        assertType(p);
        typeFound = true;
        return this._store.get(p);
      }
    }

    if (!typeFound) {
      // console.log(path, context)
    }
  }

  /**
   * Attempts to find an element. Does NOT error if a path is not found
   */
  find(path: string, context = "") {
    return this.get(path, context, false);
  }

  has(path: string): boolean {
    return this._store.has(path);
  }
}

export const typeStore = new Store();

// expects an absolute path
export const findElement = (modelicaPath: string) => {
  return typeStore.find(modelicaPath);
};

function assertType(type: string) {
  if (!MODELICA_LITERALS.includes(type) && !typeStore.has(type)) {
    throw new Error(`${type} not defined`);
  }
}

// TODO: remove this once types are shared between FE and BE
export interface TemplateInput {
  // id: number;
  type: string;
  name: string;
  modelicaPath: string;
  visible: boolean;
  inputs?: string[];
  group?: Literal | string;
  tab?: string;
  value?: any;
  enable?: any;
  elementType: string;
}

export interface ScheduleOption extends TemplateInput {
  groups: string[];
}

export abstract class Element {
  modelicaPath = "";
  name = "";
  type = "";
  description = "";
  entryPoint = false;
  duplicate = false;

  abstract getInputs(
    inputs?: { [key: string]: TemplateInput },
    recursive?: boolean,
  ): { [key: string]: TemplateInput };

  registerPath(path: string): boolean {
    const isSet = typeStore.set(path, this);
    this.duplicate = !isSet;
    return isSet;
  }

  // 'Input' and 'InputGroup' and 'Extend' returns modifications and override
  // this method. Other elements do not have a modification
  getModifications(): Modification[] {
    return [];
  }
}

export class InputGroupShort extends Element {
  value: string;
  description: string;
  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    const specifier = definition.class_specifier.short_class_specifier;
    this.name = specifier.identifier;
    const classValue = specifier?.value;
    this.value = classValue.description?.description_string;
    this.description = classValue.name;
    this.modelicaPath = `${basePath}.${this.name}`;
    const registered = this.registerPath(this.modelicaPath);
    if (!registered) {
      return; // PUNCH-OUT!
    }
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    return inputs;
  }
}

export class InputGroup extends Element {
  annotation: Modification[] = [];
  elementList: Element[] = [];
  description: string = "";
  entryPoint = false;
  mod: Modification | undefined;

  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifier;

    this.modelicaPath = basePath ? [basePath, this.name].join(".") : this.name;
    const registered = this.registerPath(this.modelicaPath);

    if (!registered) {
      return; // PUNCH-OUT!
    }

    this.type = this.modelicaPath;
    this.description = specifier.description_string;

    this.elementList = specifier.composition.element_list
      .map((e: any) => _constructElement(e, this.modelicaPath))
      .filter((e: Element | undefined) => e !== undefined);

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

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    // A group with no elementList is ignored
    if (this.modelicaPath in inputs || this.elementList.length === 0) {
      return inputs;
    }

    const children = this.elementList.filter((el) => {
      return Object.keys(el.getInputs(inputs)).length > 0;
    });

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      name: this.description,
      visible: false,
      inputs: children
        .map((c) => c.modelicaPath)
        .filter((c) => !(c in MODELICA_LITERALS)),
      elementType: this.elementType
    };

    return inputs;
  }

  getModifications() {
    return this.elementList.flatMap((e) => e.getModifications());
  }
}

// a parameter with a type
export class Input extends Element {
  mod?: Modification | null;
  type = ""; // modelica path
  value: any; // modelica path?
  description = "";
  final = false;
  inner: boolean | null = null;
  outer: boolean | null = null;
  connectorSizing = false;
  visible = false; //
  annotation: Modification[] = [];
  tab? = "";
  // TODO: Fix any typing
  group?: any = "";
  enable: any; // Expression = { expression: "", modelicaPath: "" };

  constructor(definition: mj.ProtectedElement, basePath: string, public elementType: string) {
    super();
    const componentClause = definition.component_clause;
    const declarationBlock = componentClause.component_list.find(
      (c: any) => "declaration" in c,
    )?.declaration as DeclarationBlock;
    this.name = declarationBlock.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    const registered = this.registerPath(this.modelicaPath);

    if (!registered) {
      return; // PUNCH-OUT!
    }

    this.final = definition.final ? definition.final : this.final;
    this.inner = definition.inner;
    this.outer = definition.outer;
    this.type = componentClause.type_specifier;

    // description block (where the annotation is) can be in different locations
    // constrainby changes this location
    const descriptionBlock =
      componentClause.component_list.find((c: any) => "description" in c)
        ?.description || definition["description"];

    if (descriptionBlock) {
      this.description = descriptionBlock?.description_string || "";
      if (descriptionBlock?.annotation) {
        this.annotation = descriptionBlock.annotation
          .map((mod: Mod | WrappedMod) =>
            createModification({ definition: mod }),
          )
          .filter((m) => m !== undefined) as Modification[];
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
  }

  /**
   * Sets tab and group if found
   * Sets a couple params that determine if an input should be visible
   */
  _setUIInfo() {
    const dialog = this.annotation.find((m) => m.name === "Dialog");
    if (dialog) {
      const group = dialog.mods.find((m) => m.name === "group")?.value;
      const tab = dialog.mods.find((m) => m.name === "tab")?.value;

      this.group = group ? evaluateExpression(group) : "";
      this.tab = tab ? evaluateExpression(tab) : "";
      this.enable = dialog.mods.find((m) => m.name === "enable")?.value;
      this.connectorSizing = dialog.mods.find((m) => m.name === "connectorSizing")?.value || false;
    }
  }

  _setInputVisible(inputType: TemplateInput | undefined): boolean {
    let isVisible = !(
      this.outer ||
      this.final ||
      // this.enable || // TODO: evaluate the expression and use if it returns a literal
      this.connectorSizing
    );

    const isLiteral = (this.type in MODELICA_LITERALS);
    return (isVisible && (isLiteral || inputType?.visible === true));
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.modelicaPath in inputs) {
      return inputs;
    }

    const typeInstance = typeStore.get(this.type) || null;
    const inputTypes = typeInstance ? typeInstance.getInputs({}, false) : {};
    const childInputs = inputTypes[this.type]?.inputs || [];
    const visible = this._setInputVisible(inputTypes[this.type]);

    // if path is present, just return

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      group: this.group,
      tab: this.tab,
      visible: visible,
      enable: this.enable,
      inputs: childInputs,
      elementType: this.elementType
    };

    if (recursive) {
      if (typeInstance) {
        inputs = typeInstance.getInputs(inputs);
      }
    }

    return inputs;
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
  constructor(definition: mj.ProtectedElement, basePath: string, elementType: string) {
    super(definition, basePath, elementType);

    // the default value is original type provided
    this.value = this.type;

    const mod = createModification({
      name: this.name,
      value: this.value,
      basePath: basePath,
    });

    if (mod) {
      this.mods.push(mod);
    }

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

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.modelicaPath in inputs) {
      return inputs;
    }

    // if an annotation has been provided, use the choices from that annotation
    // otherwise fallback to using the parameter type
    const childTypes = this.choices.length ? this.choices : [this.type];

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      inputs: childTypes,
      group: this.group,
      tab: this.tab,
      visible: true,
      elementType: this.elementType
    };

    if (recursive) {
      childTypes.map((c) => {
        const typeInstance = typeStore.get(c) || null;
        if (typeInstance) {
          inputs = typeInstance.getInputs(inputs);
        }
      });
    }

    return inputs;
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

  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    const specifier = definition.class_specifier.short_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = this.modelicaPath;
    this.description = specifier.value.description.description_string;
    const registered = this.registerPath(this.modelicaPath);
    if (!registered) {
      return; // PUNCH-OUT!
    }

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

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.modelicaPath in inputs) {
      return inputs;
    }

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      name: this.description,
      type: this.type,
      visible: true,
      inputs: this.enumList.map((e) => e.modelicaPath),
      elementType: this.elementType,
    };

    // outputs a parent input, then an input for each enum type
    this.enumList.map(
      (e) =>
        (inputs[e.modelicaPath] = {
          modelicaPath: e.modelicaPath,
          name: e.description,
          type: this.type,
          value: e.modelicaPath,
          visible: false,
          elementType: this.elementType
        }),
    );

    return inputs;
  }
}

// Inherited properties by type with modifications
export class InputGroupExtend extends Element {
  mods: Modification[] = [];
  type: string = "";
  value: string = "";
  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    this.name = EXTEND_NAME; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${this.name}`;
    const registered = this.registerPath(this.modelicaPath);
    if (!registered) {
      return; // PUNCH-OUT!
    }
    this.type = definition.extends_clause.name;

    this.value = this.type;
    if (definition.extends_clause.class_modification) {
      this.mods = getModificationList(
        definition.extends_clause,
        this.modelicaPath,
      );
    }
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.modelicaPath in inputs) {
      return inputs;
    }

    const typeInstance = typeStore.get(this.type);

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: typeInstance?.name || "",
      visible: false,
      inputs: this.type.startsWith("Modelica") ? [] : [this.type],
      elementType: this.elementType
    };

    return typeInstance ? typeInstance.getInputs(inputs, recursive) : inputs;
  }

  getModifications() {
    return this.mods ? this.mods.flatMap((m) => m.getModifications()) : [];
  }
}

export class Import extends Element {
  value: string;

  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    const importClause = definition.import_clause as mj.ImportClause; // arbitrary name. Important that this will not collide with other param names
    this.name = importClause.identifier;
    this.value = importClause.name; // path to imported type
    this.modelicaPath = `${basePath}.${this.name}`;
    const registered = this.registerPath(this.modelicaPath);
    if (!registered) {
      return; // PUNCH-OUT!
    }
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    return inputs;
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
  const importClause = "import_clause";

  definition =
    "class_definition" in definition ? definition.class_definition : definition;
  // either the element type is defined ('type', 'model', 'package', or 'record') or
  // 'extend_clause' or 'component_clause' is provided
  let elementType = null;
  if ("class_prefixes" in definition) {
    elementType = definition.class_prefixes;
    // TODO: class prefix descriptors like 'partial' and 'expandable' may
    // need to be taken into account when constructing the appropriate element
    elementType = elementType.replace("partial ", "");
    elementType = elementType.replace("expandable ", "");
  } else if (extend in definition) {
    elementType = extend;
  } else if (replaceable in definition && definition.replaceable) {
    elementType = replaceable;
  } else if (component in definition) {
    elementType = component;
  } else if (importClause in definition) {
    elementType = importClause;
  }

  let element: Element | undefined;

  switch (elementType) {
    case "type":
      element = new Enum(definition, basePath, elementType);
      break;
    case "connector":
    case "model":
    case "block":
    case "record":
    case "package":
      const long_specifier =
        "long_class_specifier" in definition.class_specifier;
      element = long_specifier
        ? new InputGroup(definition, basePath, elementType)
        : new InputGroupShort(definition, basePath, elementType);
      break;
    case extend:
      element = new InputGroupExtend(definition, basePath, elementType);
      break;
    case component:
      element = new Input(definition, basePath, elementType);
      break;
    case replaceable:
      element = new ReplaceableInput(definition, basePath, elementType);
      break;
    case importClause:
      element = new Import(definition, basePath, elementType);
      break;
  }

  const result = element?.duplicate
    ? typeStore.get(element?.modelicaPath)
    : element;
  if (!result) {
    // TODO: log `definition` that could not be parsed
    // console.log(`Unable to parse the following block:\n${definition}`);
  }
  return result;
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

/**
 * Extracts the given file into the type store
 */
export const getFile = (filePath: string) => {
  const jsonData = loader(pathPrefix, filePath);
  if (jsonData) {
    return new File(jsonData, filePath);
  } else {
    // console.log(`Not found: ${filePath}`);
  }
};

// Searches a package for templates, then loads the file
// creating template instances
export const loadPackage = (filePath: string) => {
  const paths = findPackageEntryPoints(pathPrefix, filePath);

  paths?.map(({ json, path }) => new File(json, path));
};
