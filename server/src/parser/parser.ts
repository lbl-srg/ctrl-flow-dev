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

import {
  Literal,
  evaluateExpression,
  Expression,
  getExpression,
} from "./expression";
import * as mj from "./mj-types";

export const EXTEND_NAME = "__extend";
export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];
const PROJECT_PATH = "Buildings.Templates.Data.AllSystems";
const PROJECT_INSTANCE_PATH = "datAll";

// TODO: convert 'elementType' to an enum
export const isInputGroup = (elementType: string) =>
  ["model", "block", "package"].includes(elementType);

export const isDefinition = (elementType: string) =>
  !["replaceable", "component_clause", "import_clause"].includes(elementType);

export const isLiteral = (path: string) => MODELICA_LITERALS.includes(path);

class Store {
  _store: Map<string, any> = new Map();

  set(path: string, element: Element): boolean {
    if (!this.has(path)) {
      this._store.set(path, element);
      return true;
    }
    return false;
  }

  _get(path: string): Element | undefined {
    if (this._store.has(path)) {
      return this._store.get(path);
    } else {
      // walk inheritance chain to attempt to find correct element
      const pathList = path.split(".");
      const name = pathList.pop();
      const basePath = pathList.join(".");

      // avoid infinite recursion
      if (basePath !== path) {
        let element = typeStore.get(basePath, "", false); // base paths SHOULD be loaded
        while (element && isInputGroup(element.elementType)) {
          element = element as InputGroup;
          const childElements = (element as InputGroup).elementList;
          const matchedElement = childElements?.find((e) => e.name === name);
          if (matchedElement) {
            return matchedElement;
          }

          element = (element as InputGroup).extendElement;
        }
      }
    }
  }

  /**
   * Given a path and base, attempts to retrieve from the store map.
   *
   * If load is true, if a type is not found in the store attempt to load
   * the corresponding file into the store, then return the loaded results
   */
  get(path: string, basePath: string = "", load: boolean = true) {
    if (isLiteral(path) || path === "") {
      return;
    }

    const paths = this._generatePaths(path, basePath);

    for (const p of paths) {
      const e = this._get(p);
      if (e) {
        return e;
      }
    }

    // Attempt to load
    if (load) {
      const { path } = this._load(paths);
      if (!path) {
        return; // PUNCH-OUT! File not found
      }
      return this._get(path);
    }
  }

  /**
   * This needs to match the lookup behavior for modelica type references
   * where it is able to follow an order of searching based on the type. Full rules
   * are defined here: https://mbe.modelica.university/components/packages/lookup/
   *
   * TODO: convert this so it returns an iterator
   */
  _generatePaths(path: string, basePath: string): Array<string> {
    const splitBasePath = basePath ? basePath.split(".") : [];

    const pathList: string[] = [];
    while (splitBasePath.length > 0) {
      pathList.push(`${splitBasePath.join(".")}.${path}`);
      splitBasePath.pop();
    }

    pathList.push(path);

    return pathList;
  }

  // helper method to find the element with the most complete matching path
  _findPathMatch(file: File, path: string): Element | undefined {
    let topCount = 0;
    let element: Element | undefined;
    // type not found, check file elements for the file that matches the most
    // segments of the provided path and return that? Or deal with this internally?
    file.elementList.map((e) => {
      // find the element that matches as much as the path as possible
      let pathCount = 0;
      const pList = e.modelicaPath.split(".");
      e.modelicaPath.split(".").forEach((segment, i) => {
        if (segment !== undefined && pList[i] === undefined) {
          pathCount = pList[i] === segment ? pathCount + 1 : pathCount;
        }
      });
      if (pathCount > topCount) {
        topCount = pathCount;
        element = e;
      }
    });

    return element;
  }

  /**
   * Interacts with loader
   *
   * Feeds list of paths and returns the found file and the path that found it
   */
  _load(paths: Array<string>): Partial<{ file: File; path: string }> {
    // not found, attempt to load from json
    for (const p of paths) {
      const file = getFile(p);

      if (file && this.has(p)) {
        return { file, path: p };
      }
    }

    return {};
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

export function getProject() {
  const inputs = createProjectInputs();
  return inputs[PROJECT_INSTANCE_PATH];
}

/**
 * We have to spoof an instance of the project settings
 */
export function createProjectInputs(): { [key: string]: TemplateInput } {
  const allSystems = typeStore.find(PROJECT_PATH);
  const projectInputs = allSystems?.getInputs() as {
    [key: string]: TemplateInput;
  };
  const spoofedModList = Object.values(projectInputs).map((i) => {
    const modName = i.modelicaPath.split(".").pop();
    return new Modification(PROJECT_PATH, modName, i.value);
  });

  const spoofedDatAllInstance: TemplateInput = {
    modelicaPath: PROJECT_INSTANCE_PATH,
    name: PROJECT_INSTANCE_PATH,
    type: PROJECT_PATH,
    value: PROJECT_PATH,
    visible: false,
    modifiers: spoofedModList,
    inputs: [PROJECT_PATH],
    elementType: "component_clause",
  };

  const optionPatchPaths = [
    "Buildings.Templates.Data.AllSystems.ashCliZon",
    "Buildings.Templates.Data.AllSystems.tit24CliZon",
  ];

  optionPatchPaths.map((p) => {
    const option = projectInputs[p];
    if (option) {
      const prefix = "Buildings.Templates.Data.AllSystems";
      // patch enable expression with full path so project evaluation
      // continues to work
      const enableExpr = option.enable;
      const oldOperand = enableExpr.operands[0];
      if (!oldOperand.startsWith(prefix)) {
        const newOperand = `${prefix}.${enableExpr.operands[0]}`;
        enableExpr.operands[0] = newOperand;
        option.enable = enableExpr;
        projectInputs[p] = option;
      }
    }
  });
  return { [PROJECT_INSTANCE_PATH]: spoofedDatAllInstance, ...projectInputs };
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
  choiceModifiers?: { [key: string]: Modification[] };
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
  enable: Expression | boolean = false;
  annotation: Modification[] = [];
  deadEnd = false;

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

  get baseType(): string {
    const pathList = this.modelicaPath.split(".");
    pathList.pop();
    return pathList.join(".");
  }

  /**
   * The linkage keyword annotation is used to override any logic around 'enable'
   *
   * This should only be called after the annotation has attempted to be parsed!
   */
  getLinkageKeywordValue(): boolean | undefined {
    if (this.annotation) {
      const linkageKeyword = "__ctrlFlow";
      const linkageAnnotation = this.annotation.find(
        (m) => m.name === linkageKeyword,
      );

      if (linkageAnnotation) {
        const enable = linkageAnnotation.mods.find(
          (m) => m.name === "enable",
        )?.value;

        return enable !== undefined ? evaluateExpression(enable) : enable;
      }
    }
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

  getChildElements(): Element[] {
    return [];
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    return inputs;
  }
}

export class InputGroup extends Element {
  annotation: Modification[] = [];
  elementList: Element[] | undefined = [];
  description: string = "";
  entryPoint = false;
  mods: Modification[] | undefined;
  extendElement: InputGroup | undefined;
  extendElementDeadEnd = false;

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

    this.elementList =
      specifier.composition.element_list
        ?.map((e: any) => {
          const element = _constructElement(e, this.modelicaPath);
          if (element?.elementType === "extends_clause") {
            const extendParam = element as InputGroupExtend;
            this.mods = extendParam.mods;
            this.extendElement = typeStore.get(extendParam.type) as InputGroup;
            // Kludge - the instatiation of the extend type (extendParam) should
            // likely be assigned and not the fetched type. However with how
            // the extend param is unpacked into the InputGroup, this is a smaller
            // change
            this.extendElementDeadEnd = extendParam.deadEnd;
          }
          return element;
        })
        ?.filter((e: Element | undefined) => e !== undefined)
        ?.filter((e: Element) => e.elementType !== "extends_clause") || [];

    this.annotation = specifier.composition.annotation?.map(
      (m: mj.Mod | mj.WrappedMod) => createModification({ definition: m }),
    );
    this.deadEnd = this.getLinkageKeywordValue() === false;

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
   * Returns the list of elements with all inherited elements flattened
   */
  getChildElements(useDeadEnd = false): Element[] {
    const elements = this.elementList || [];

    return (
      this.extendElement === undefined ||
      (this.extendElementDeadEnd && useDeadEnd)
        ? elements
        : [...elements, ...this.extendElement?.getChildElements(useDeadEnd)]
    ).filter((el) => Object.keys(el.getInputs({}, false)).length > 0);
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    // A group with no elementList is ignored
    if (this.modelicaPath in inputs || this.getChildElements().length === 0) {
      return inputs;
    }

    // DO only assign child element paths from this.getChildElements
    // DO load from the full elementList
    // make sure all options are added to the bag of inputs
    this.getChildElements().forEach((el) => el.getInputs(inputs));

    // get filtered child list
    const children = this.getChildElements(true)
      .filter((el) => !el.deadEnd)
      .filter((el) => !(el.modelicaPath in MODELICA_LITERALS))
      .map((el) => el.modelicaPath);

    // make sure all child elements (extend + other elements) get
    // template inputs added
    this.extendElement?.getInputs(inputs);
    this.elementList?.map((e) => e.getInputs(inputs));

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      name: this.description,
      value: this.modelicaPath,
      visible: false,
      inputs: children,
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
  tab? = "";
  group?: any = "";

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
    const typeElement = typeStore.get(componentClause.type_specifier, basePath);
    this.type = typeElement?.modelicaPath || componentClause.type_specifier; // might be a literal
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
            createModification({
              definition: mod,
              basePath,
              baseType: this.type,
            }),
          )
          .filter((m) => m !== undefined) as Modification[];
      }
    }
    this.deadEnd = this.getLinkageKeywordValue() === false;
    this.mod = declarationBlock.modification
      ? createModification({
          definition: declarationBlock,
          basePath: basePath,
          baseType: this.type,
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
    const isInputGroupType = isInputGroup(typeInstance?.elementType);
    const isReplaceable =
      this.annotation.find((m) => m.name === "choices") !== undefined;
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

      if (isInputGroupType && !isReplaceable) {
        this.enable = enable ? enable : false;
      } else {
        this.enable = enable ? enable : true;
      }

      this.connectorSizing = connectorSizing
        ? evaluateExpression(connectorSizing)
        : false;
    } else {
      this.enable = isInputGroupType && !isReplaceable ? this.enable : true;
    }
  }

  _setInputVisible(inputType: TemplateInput | undefined): boolean {
    let isVisible = !(
      this.outer ||
      this.final ||
      this.connectorSizing === true
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
    let childInputs =
      this.enable === false ? [] : inputTypes[this.type]?.inputs || [];

    childInputs.filter((inputType) => {
      const element = typeStore.get(inputType);
      return !element?.deadEnd;
    });

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      value: this.value,
      name: this.description,
      group: this.group,
      tab: this.tab,
      visible: visible,
      enable: this.deadEnd ? false : this.enable,
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
  choiceMods: { [key: string]: Modification[] } = {};
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
      value: getExpression(this.value, basePath),
      basePath: basePath,
      baseType: this.type,
    });

    if (mod) {
      this.mods.push(mod);
    }

    // modifiers for replaceables are specified in a constraining
    // interface. Check if one is present to extract modifiers
    if (definition.constraining_clause) {
      const constraintDef = definition.constraining_clause;
      this.constraint = typeStore.get(constraintDef.name, basePath) as Element;
      this.mods = constraintDef?.class_modification
        ? [
            ...this.mods,
            ...getModificationList(
              constraintDef,
              basePath,
              this.constraint.modelicaPath,
            ),
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
          if (choice.mods.length > 0) {
            this.choiceMods[choice.value] = choice.mods;
          }
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
      enable: this.enable,
      choiceModifiers: this.choiceMods,
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
      value: this.modelicaPath,
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

  constructor(definition: any, basePath: string, public elementType: string) {
    super();
    this.name = EXTEND_NAME; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${this.name}`;
    const typeElement = typeStore.get(definition.extends_clause.name, basePath);
    this.type = typeElement?.modelicaPath || definition.extends_clause.name;

    const annotations = definition.extends_clause?.annotation;

    if (annotations) {
      this.annotation = definition.extends_clause?.annotation
        .map((mod: mj.Mod | mj.WrappedMod) =>
          createModification({
            definition: mod,
            basePath: basePath,
            baseType: this.type,
          }),
        )
        .filter((m: any) => m !== undefined) as Modification[];
      this._setUIInfo();
    }

    this.deadEnd = this.getLinkageKeywordValue() === false;
    const registered = this.registerPath(this.modelicaPath, this.type);
    if (!registered) {
      return; // PUNCH-OUT!
    }

    this.value = this.type;
    if (definition.extends_clause.class_modification) {
      this.mods = getModificationList(
        definition.extends_clause,
        basePath,
        this.type,
      );
    }
  }

  _setUIInfo() {
    this.enable = false;
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.modelicaPath in inputs) {
      return inputs;
    }

    const typeInstance = typeStore.get(this.type);

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

  /**
   * 'Extend' statements do not generate a unique TemplateInput as they are inherited
   * by the InputGroup that uses them. So this function is a noop
   */
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
    case "class":
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

  // Attempt to load project settings from a pre-defined path
  const projectPath = "Buildings.Templates.Data.AllSystems";
  getFile(projectPath);
};
