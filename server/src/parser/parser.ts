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
  Modification,
  getModificationList,
} from "./modification";

import { Literal, evaluateExpression, Expression } from "./expression";
import * as mj from "./mj-types";

export const EXTEND_NAME = "__extend";
// TODO: templates *should* have all types defined within a template - however there will
// be upcoming changes once unit changes are supported
export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];
// TODO: convert 'elementType' to an enum
export const isInputGroup = (elementType: string) =>
  ["model", "block", "package"].includes(elementType);

export const isDefinition = (elementType: string) =>
  !(["replaceable", "component_clause", "import_clause"].includes(elementType));

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
    for (const p of paths) {
      if (this._store.has(p)) {
        return this._store.get(p);
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
  _generatePaths(path: string, context: string): Array<string> {
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

export interface TemplateInput {
  type: string;
  name: string;
  modelicaPath: string;
  visible: boolean;
  inputs?: string[];
  group?: Literal | string;
  tab?: string;
  value?: any;
  enable?: any;
  modifiers?: Modification[];
  elementType: string;
}

export abstract class Element {
  modelicaPath = "";
  name = "";
  type = "";
  description = "";
  entryPoint = false;
  duplicate = false;
  elementType = "";

  abstract getInputs(
    inputs?: { [key: string]: TemplateInput },
    recursive?: boolean,
  ): { [key: string]: TemplateInput };

  registerPath(path: string, type: string = ""): boolean {
    const isSet = typeStore.set(path, this);
    if (type) {
      typeStore.get(type);
    }
    this.duplicate = !isSet;
    return isSet;
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
    const registered = this.registerPath(this.modelicaPath, this.type);
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
  mods: Modification[] | undefined;
  extendElement: InputGroup | undefined;
  deadEnd: boolean = false;

  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifier;

    this.modelicaPath = basePath ? [basePath, this.name].join(".") : this.name;
    this.type = this.modelicaPath;
    const registered = this.registerPath(this.modelicaPath, this.type);

    if (!registered) {
      return; // PUNCH-OUT!
    }

    this.description = specifier.description_string;

    this.elementList = specifier.composition.element_list
      .map((e: any) => {
        const element = _constructElement(e, this.modelicaPath);
        if (element?.elementType === "extends_clause") {
          const extendParam = element as InputGroupExtend;
          this.mods = extendParam.mods; // TODO: merge modifiers?
          this.deadEnd = extendParam.deadEnd;
          this.extendElement = typeStore.get(extendParam.type) as InputGroup;
        }
        return element;
      })
      .filter((e: Element | undefined) => e !== undefined)
      .filter((e: Element) => e.elementType !== "extends_clause");

    this.annotation = specifier.composition.annotation?.map(
      (m: mj.Mod | mj.WrappedMod) => createModification({ definition: m }),
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

  /**
   * Returns child elements including extended class child elements as a flat list
   */
  getChildElements(): Element[] {
    return this.deadEnd || this.extendElement === undefined
      ? this.elementList
      : [...this.elementList, ...this.extendElement?.getChildElements()];
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    // A group with no elementList is ignored
    if (this.modelicaPath in inputs || this.getChildElements().length === 0) {
      return inputs;
    }

    const elementList = this.getChildElements();

    const children = elementList.filter((el) => {
      return Object.keys(el.getInputs(inputs)).length > 0;
    });

    // extend element children may or may not be included as children
    // this call just makes sure the children get added to 'inputs'
    this.extendElement?.getInputs(inputs);

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      name: this.description,
      visible: false,
      inputs: children
        .map((c) => c.modelicaPath)
        .filter((c) => !(c in MODELICA_LITERALS)),
      elementType: this.elementType,
      modifiers: this.mods,
    };

    return inputs;
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
  annotation: Modification[] = [];
  tab? = "";
  group?: any = "";
  enable: Expression | boolean = false;

  constructor(
    definition: mj.ProtectedElement,
    basePath: string,
    public elementType: string,
  ) {
    super();
    const componentClause = definition.component_clause;
    const declarationBlock = componentClause.component_list.find(
      (c: any) => "declaration" in c,
    )?.declaration as mj.DeclarationBlock;
    this.name = declarationBlock.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = componentClause.type_specifier;
    this.final = definition.final ? definition.final : this.final;
    this.inner = definition.inner;
    this.outer = definition.outer;
    const registered = this.registerPath(this.modelicaPath, this.type);

    if (!registered) {
      return; // PUNCH-OUT!
    }

    // description block (where the annotation is) can be in different locations
    // constrainby changes this location
    const descriptionBlock =
      componentClause.component_list.find((c: any) => "description" in c)
        ?.description || definition["description"];

    if (descriptionBlock) {
      this.description = descriptionBlock?.description_string || "";
      if (descriptionBlock?.annotation) {
        this.annotation = descriptionBlock.annotation
          .map((mod: mj.Mod | mj.WrappedMod) =>
            createModification({ definition: mod }),
          )
          .filter((m) => m !== undefined) as Modification[];
      }
    }

    this.mod = declarationBlock.modification
      ? createModification({
          definition: declarationBlock,
          basePath: basePath,
          name: this.name,
        })
      : null;

    if (this.mod && !this.mod.empty) {
      this.value = this.mod.value;
    }
    this._setUIInfo();
  }

  /**
   * Sets tab and group if found
   * Sets a couple params that determine if an input should be visible
   */
  _setUIInfo() {
    const dialog = this.annotation.find((m) => m.name === "Dialog");

    const typeInstance = typeStore.find(this.type) as Element;
    // TODO: elementTypes need to be split out into an enum...
    const isInputGroupType = isInputGroup(typeInstance?.elementType);
    // for class types, no dialog annotation means don't enable
    // for all other types it is true

    if (dialog) {
      const group = dialog.mods.find((m) => m.name === "group")?.value;
      const tab = dialog.mods.find((m) => m.name === "tab")?.value;
      const enable = dialog.mods.find((m) => m.name === "enable")?.value;
      const connectorSizing = dialog.mods.find(
        (m) => m.name === "connectorSizing",
      )?.value;

      this.group = group ? evaluateExpression(group) : "";
      this.tab = tab ? evaluateExpression(tab) : "";
      // const typeInstance = typeStore.find(this.type) as Element;
      // // TODO: elementTypes need to be split out into an enum...
      // const isInputGroupType = isInputGroup(typeInstance?.elementType);
      // // for class types, no dialog annotation means don't enable
      // // for all other types it is true
      if (isInputGroupType) {
        this.enable = enable ? evaluateExpression(enable) : false;
      } else {
        this.enable = enable ? evaluateExpression(enable) : true;
      }

      this.connectorSizing = connectorSizing
        ? evaluateExpression(connectorSizing)
        : false;
    } else {
      this.enable = isInputGroupType ? this.enable : true;
    }
  }

  _setInputVisible(inputType: TemplateInput | undefined): boolean {
    let isVisible = !(
      this.outer ||
      this.final ||
      this.connectorSizing === true ||
      this.enable === false
    );

    const isLiteral = MODELICA_LITERALS.includes(this.type);
    /**
     *
     * Replaceables -> dropdown -> each child of selected component
     *
     * Component -> Each child becomes it's own dropdown
     *
     */
    return isVisible && (isLiteral || inputType?.visible === true);
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.modelicaPath in inputs) {
      return inputs;
    }

    // if a replaceable and in modification store - use that type
    // if not in mod store, use 'this.type'
    const typeInstance = typeStore.get(this.type) || null;
    const inputTypes = typeInstance ? typeInstance.getInputs({}, false) : {};
    const visible = this._setInputVisible(inputTypes[this.type]);
    const childInputs =
      this.enable === false ? [] : inputTypes[this.type]?.inputs || [];

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
      modifiers: this.mod ? [this.mod as Modification] : [],
      elementType: this.elementType,
    };

    if (recursive) {
      if (typeInstance) {
        inputs = typeInstance.getInputs(inputs);
      }
    }

    return inputs;
  }
}

export class ReplaceableInput extends Input {
  choices: string[] = [];
  constraint: Element | undefined;
  mods: Modification[] = [];
  mod: Modification | undefined;
  constructor(
    definition: mj.ProtectedElement,
    basePath: string,
    elementType: string,
  ) {
    super(definition, basePath, elementType);

    // the default value is original type provided
    this.value = this.type;

    const mod = createModification({
      name: this.name,
      value: this.value,
      basePath: this.type,
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
            ...getModificationList(constraintDef, constraintDef.name),
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
    const visible = childTypes.length > 1;

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      inputs: childTypes,
      group: this.group,
      tab: this.tab,
      visible: visible,
      modifiers: this.mods,
      elementType: this.elementType,
    };

    if (recursive) {
      childTypes.map((c) => {
        // TODO: applying mods from the parameter to child types?
        const typeInstance = typeStore.get(c) || null;
        if (typeInstance) {
          inputs = typeInstance.getInputs(inputs);
        }
      });
    }

    return inputs;
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
    const registered = this.registerPath(this.modelicaPath, this.type);
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
          elementType: this.elementType,
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
  annotation: Modification[] = [];
  deadEnd: boolean;
  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    this.name = EXTEND_NAME; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = definition.extends_clause.name;
    this.deadEnd = false;

    const annotations = definition.extends_clause?.annotation;

    if (annotations) {
      this.annotation = definition.extends_clause?.annotation
        .map((mod: mj.Mod | mj.WrappedMod) =>
          createModification({ definition: mod }),
        )
        .filter((m: any) => m !== undefined) as Modification[];
      this._setUIInfo();
    }

    const registered = this.registerPath(this.modelicaPath, this.type);
    if (!registered) {
      return; // PUNCH-OUT!
    }

    this.value = this.type;
    if (definition.extends_clause.class_modification) {
      this.mods = getModificationList(definition.extends_clause, this.type);
    }
  }

  _setUIInfo() {
    const __Linkage = this.annotation.find((m) => m.name === "__Linkage");

    if (__Linkage) {
      const enable = __Linkage.mods.find((m) => m.name === "enable")?.value;

      this.deadEnd = enable ? !evaluateExpression(enable) : false;
    }
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.modelicaPath in inputs) {
      return inputs;
    }

    const typeInstance = typeStore.get(this.type);
    // inputs[this.modelicaPath] = {
    //   modelicaPath: this.modelicaPath,
    //   type: this.type,
    //   value: this.value,
    //   name: typeInstance?.name || "",
    //   visible: false,
    //   inputs: this.type.startsWith("Modelica") ? [] : [this.type],
    //   elementType: this.elementType,
    //   modifiers: this.mods,
    // };

    return typeInstance ? typeInstance.getInputs(inputs, recursive) : inputs;
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
