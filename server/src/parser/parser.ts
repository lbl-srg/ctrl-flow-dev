/**
 * The parser extracts modelica-json with the goal of finding each point of 'input' in modelica-json.
 * Various structures in modelica are generically converted to 'elements', with each specific structure
 * implemented as a class that extends the 'Element' base class.
 *
 * The parser also keeps a store of type definitions, so that as json is unpacked and converted to
 * an 'Element' that element is available if referenced by another piece of modelica-json.
 */

import {
  findPackageEntryPoints,
  loader,
  TEMPLATE_LIST,
  PACKAGE_LIST,
} from "./loader";
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
const PROJECT_PATH = "Buildings.Templates.Data.AllSystems";
const PROJECT_INSTANCE_PATH = "datAll";

export const MLS_PREDEFINED_TYPES = ["String", "Boolean", "Real", "Integer"];
export const MLS_SPECIALIZED_CLASSES = [
  "block",
  "class",
  "connector",
  "model",
  "package",
  "record",
  "type",
];
const ELEMENT_TYPES = [
  ...MLS_SPECIALIZED_CLASSES, // Modelica specialized classes
  ...MLS_SPECIALIZED_CLASSES.map((c) => `${c}-short`), // Modelica specialized classes as short class definitions
  "component_clause", // Local typing for parsing purposes
  "extends_clause",
  "import_clause",
] as const;
const TEMPLATE_CLASSES: ElementType[] = ["block", "model"]; // Specialized classes that may be used as templates

type ElementType = (typeof ELEMENT_TYPES)[number];

export const isInputGroup = (elementType: ElementType | undefined): boolean =>
  ["model", "block", "package"].some((el) => elementType?.includes(el));

export const isDefinition = (elementType: ElementType): boolean =>
  !["component_clause", "import_clause"].includes(elementType);

export const isPredefinedType = (path: string) =>
  MLS_PREDEFINED_TYPES.includes(path);

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
          element = element as LongClass;
          const childElements = (element as LongClass).elementList;
          const matchedElement = childElements?.find((e) => e.name === name);
          if (matchedElement) {
            return matchedElement;
          }

          element = (element as LongClass).extendElement;
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
    if (isPredefinedType(path) || path === "") {
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
  if (!MLS_PREDEFINED_TYPES.includes(type) && !typeStore.has(type)) {
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
    visible: false,
    modifiers: spoofedModList,
    inputs: [PROJECT_PATH],
    elementType: "component_clause",
    replaceable: false,
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
  elementType: ElementType;
  replaceable?: boolean;
}

// Additional properties for replaceable elements
interface Replaceable extends Element {
  choices?: string[];
  choiceMods?: { [key: string]: Modification[] };
  constraint?: Element;
  mods?: Modification[];
  value?: any;
}

// Utility function to handle replaceable elements (classes or instances)
function initializeReplaceable(
  instance: Replaceable,
  definition: any,
  basePath: string,
) {
  instance.choices = [];
  instance.choiceMods = {};
  instance.mods = [];

  // Schema for replaceable elements:
  // - 'type' stores the actual/aliased type
  // - 'value' is "" if no binding (=) is provided, or the binding value for components
  //
  // For replaceable components:
  // - 'type' = declared type (already set by Component constructor)
  // - 'value' = undefined if no binding, or the binding value if present
  //
  // For short class definitions:
  // - 'type' = aliased type (already set by ShortClass constructor)
  // - 'value' = undefined
  // For short classes: type contains the aliased type, value is undefined (set in ShortClass constructor)

  // Handle constraining-clause clause if present
  if (definition.constraining_clause) {
    // From MLS: description of replaceable elements is
    // - within class-definition | component-clause if there is no constraining-clause
    //   (it is then already handled by the constructor of the caller class)
    // - at the same level of class-definition | component-clause if there is a constraining-clause
    const descriptionBlock = definition.description;
    instance.description = descriptionBlock?.description_string || "";
    instance.annotation = createAnnotationModifications(
      descriptionBlock,
      basePath,
      instance.type,
    );

    const constraintDef = definition.constraining_clause;
    instance.constraint = typeStore.get(
      constraintDef.name,
      basePath,
    ) as Element;
    if (constraintDef?.class_modification) {
      instance.mods = [
        ...instance.mods,
        ...getModificationList(
          constraintDef,
          basePath,
          instance.constraint.modelicaPath,
        ),
      ];
    }
  }

  const choices = instance.annotation.find(
    (m) => m.name === "choices",
  ) as Modification;

  if (choices) {
    choices.mods.map((choice) => {
      if (choice.value) {
        instance.choices!.push(choice.value as string);
        if (choice.mods.length > 0) {
          instance.choiceMods![choice.value] = choice.mods;
        }
      } else {
        throw new Error("Malformed 'Choices' specified");
      }
    });
  }
}

// Utility function to handle replaceable elements (classes or instances)
function getReplaceableInputs(
  inputs: { [key: string]: TemplateInput },
  recursive: boolean,
  instance: Replaceable,
): { [key: string]: TemplateInput } {
  if (instance.modelicaPath in inputs) {
    return inputs;
  }

  // if an annotation has been provided, use the choices from that annotation
  // otherwise fallback to using the parameter type
  let choiceTypes = instance.choices;
  let choiceMods = instance.choiceMods;

  // ultimately, fall back fallback to using the instance type
  if (!choiceTypes?.length) {
    choiceTypes = [instance.type];
  }

  const spoofTemplateInput: TemplateInput = {
    type: "Real",
    name: "temperature",
    modelicaPath: "MyModel.temperature",
    visible: true,
    elementType: "model",
  };

  inputs[instance.modelicaPath] = {
    modelicaPath: instance.modelicaPath,
    type: instance.type,
    value: instance.value,
    name: instance.description,
    inputs: choiceTypes,
    group: instance.group,
    tab: instance.tab,
    visible: setInputVisible(spoofTemplateInput, instance),
    modifiers: instance.mods,
    elementType: instance.elementType,
    enable: instance.enable,
    choiceModifiers: choiceMods,
    replaceable: instance.replaceable,
  };

  if (recursive) {
    choiceTypes?.map((c) => {
      const typeInstance = typeStore.get(c) || null;
      if (typeInstance) {
        inputs = typeInstance.getInputs(inputs);
      }
    });
  }

  return inputs;
}

export abstract class Element {
  modelicaPath = "";
  name = "";
  type = "";
  description = "";
  entryPoint = false;
  duplicate = false;
  elementType!: ElementType;
  replaceable: boolean = false;
  enable: Expression | boolean = false;
  annotation: Modification[] = [];
  deadEnd = false;
  final = false;
  inner: boolean | null = null;
  outer: boolean | null = null;
  tab = "";
  group = "";

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

export class ShortClass extends Element {
  mods?: Modification[];
  value?: string; // undefined for short class definitions (no binding)
  constructor(
    definition: any,
    basePath: string,
    public elementType: ElementType,
  ) {
    super();
    const specifier = (definition.class_definition ?? definition)
      .class_specifier.short_class_specifier;
    const specifierType = typeStore.get(specifier.value?.name, basePath);
    this.name = specifier.identifier;
    // For short class definitions:
    // - modelicaPath: the short class name (e.g., Parent.Medium)
    // - type: the aliased type (e.g., SomeMedium)
    // - value: undefined (no binding for class definitions)
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = specifierType?.modelicaPath || specifier.value?.name;
    // value remains undefined - no binding for short class definitions
    const registered = this.registerPath(this.modelicaPath, this.type);
    if (!registered) {
      return; // PUNCH-OUT!
    }
    this.description = definition.description?.description_string;
    this.replaceable = definition.replaceable;

    if (this.replaceable) {
      initializeReplaceable(this, definition, basePath);
    }
    setUIInfo(this);
  }

  getChildElements(): Element[] {
    // Retrieve the child elements from the aliased type (stored in this.type)
    const typeSpecifier = typeStore.get(this.type) as LongClass;

    return typeSpecifier == null ? [] : typeSpecifier.getChildElements();
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    // Retrieve the inputs from the aliased type (stored in this.type)
    const typeSpecifier = typeStore.get(this.type) as LongClass;

    if (typeSpecifier == null) {
      return inputs;
    }
    // A group with no elementList is ignored
    if (
      this.modelicaPath in inputs ||
      typeSpecifier.getChildElements().length === 0
    ) {
      return inputs;
    }
    if (this.replaceable) {
      inputs = getReplaceableInputs(inputs, recursive, this);
      return inputs;
    }
    return typeSpecifier.getInputs();
  }
}

export class LongClass extends Element {
  elementList: Element[] | undefined = [];
  entryPoint = false;
  mods: Modification[] | undefined;
  extendElement: LongClass | undefined;
  extendElementDeadEnd = false;

  constructor(
    definition: any,
    basePath: string,
    public elementType: ElementType,
  ) {
    super();
    const specifier = (definition.class_definition ?? definition)
      .class_specifier.long_class_specifier;
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
            const extendParam = element as Extend;
            this.mods = extendParam.mods;
            this.extendElement = typeStore.get(extendParam.type) as LongClass;
            // Kludge - the instatiation of the extend type (extendParam) should
            // likely be assigned and not the fetched type. However with how
            // the extend param is unpacked into the LongClass, this is a smaller
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

    if ([...TEMPLATE_LIST, ...PACKAGE_LIST].includes(this.modelicaPath)) {
      this.entryPoint = true;
      if (TEMPLATE_LIST.includes(this.modelicaPath)) {
        new Template(this);
      }
    }
  }

  /**@
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
      .filter((el) => !(el.modelicaPath in MLS_PREDEFINED_TYPES))
      .map((el) => el.modelicaPath);

    // make sure all child elements (extend + other elements) get
    // template inputs added
    this.extendElement?.getInputs(inputs);
    this.elementList?.map((e) => e.getInputs(inputs));

    inputs[this.modelicaPath] = {
      modelicaPath: this.modelicaPath,
      type: this.type,
      name: this.description,
      visible: false,
      inputs: children,
      elementType: this.elementType,
      modifiers: this.mods,
      replaceable: this.replaceable,
    };

    return inputs;
  }
}

/**
 * Creates annotation modifications from a description block
 */
function createAnnotationModifications(
  descriptionBlock:
    | {
        annotation?: Array<mj.Mod | mj.WrappedMod>;
      }
    | undefined,
  basePath: string,
  baseType: string,
): Modification[] {
  if (!descriptionBlock?.annotation) {
    return [];
  }

  return descriptionBlock.annotation
    .map((mod: mj.Mod | mj.WrappedMod) =>
      createModification({
        definition: mod,
        basePath,
        baseType,
      }),
    )
    .filter((m) => m !== undefined) as Modification[];
}

/**
 * Sets tab and group if found
 * Sets a couple params that determine if an input should be visible
 */
function setUIInfo(instance: Element): void {
  const dialog = instance.annotation.find((m) => m.name === "Dialog");

  const instanceType = typeStore.find(instance.type) as Element;
  const isInputGroupType = isInputGroup(instanceType?.elementType);
  const hasChoices =
    instance.annotation.find((m) => m.name === "choices") !== undefined;
  // for composite types (input groups), don't enable if:
  // - no dialog annotation and
  // - not replaceable or replaceable w/o choices annotation (the latter is specific to ctrl-flow)
  // for all other types enable by default
  const isDisabledGroup =
    isInputGroupType &&
    (!instance.replaceable || (instance.replaceable && !hasChoices));
  if (dialog) {
    const group = dialog.mods.find((m) => m.name === "group")?.value;
    const tab = dialog.mods.find((m) => m.name === "tab")?.value;
    const enable = dialog.mods.find((m) => m.name === "enable")?.value;

    instance.group = group ? evaluateExpression(group) : "";
    instance.tab = tab ? evaluateExpression(tab) : "";
    const _enable = isDisabledGroup ? false : true;
    instance.enable = enable ? enable : _enable;
  } else {
    instance.enable = isDisabledGroup ? instance.enable : true;
  }
}

function setInputVisible(
  inputType: TemplateInput | undefined,
  instance: Element,
): boolean {
  const dialog = instance.annotation.find((m) => m.name === "Dialog");
  let connectorSizing = dialog?.mods.find(
    (m) => m.name === "connectorSizing",
  )?.value;
  connectorSizing = connectorSizing
    ? evaluateExpression(connectorSizing)
    : false;

  let isVisible = !(
    instance.outer ||
    instance.final ||
    connectorSizing === true
  );

  const isPredefinedType = MLS_PREDEFINED_TYPES.includes(instance.type);

  return isVisible && (isPredefinedType || inputType?.visible === true);
}

export class Component extends Element implements Replaceable {
  mod?: Modification | null;
  type = ""; // modelica path
  value: any; // assigned value (as Expression) if there's a binding (=), otherwise undefined
  description = "";
  connectorSizing = false;
  // Optional properties for replaceable elements
  choices?: string[];
  choiceMods?: { [key: string]: Modification[] };
  constraint?: Element;
  mods?: Modification[];

  constructor(
    definition: mj.Element,
    basePath: string,
    public elementType: ElementType,
  ) {
    super();
    const componentClause = definition.component_clause;
    const declarationBlock = componentClause.component_list.find(
      (c: any) => "declaration" in c,
    )?.declaration as mj.DeclarationBlock;
    this.name = declarationBlock.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    const typeElement = typeStore.get(componentClause.type_specifier, basePath);
    this.type = typeElement?.modelicaPath || componentClause.type_specifier; // might be a predefined type from MLS
    this.final = definition.final ? definition.final : this.final;
    this.inner = definition.inner;
    this.outer = definition.outer;
    this.replaceable = definition.replaceable;
    const registered = this.registerPath(this.modelicaPath, this.type);
    if (!registered) {
      return; // PUNCH-OUT!
    }

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

    // From MLS: description of non-replaceable components is within component-clause
    const descriptionBlock = componentClause.component_list.find(
      (c: any) => "description" in c,
    )?.description;
    this.description = descriptionBlock?.description_string || "";
    this.annotation = createAnnotationModifications(
      descriptionBlock,
      basePath,
      this.type,
    );

    if (this.replaceable) {
      // The following may modify descriptionBlock and this.annotation
      initializeReplaceable(this, definition, basePath);
    }

    // Must be called last since it uses this.annotation
    // which gets modified by initializeReplaceable()
    this.deadEnd = this.getLinkageKeywordValue() === false;
    setUIInfo(this);
  }

  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    if (this.replaceable) {
      inputs = getReplaceableInputs(inputs, recursive, this);
      return inputs;
    }
    if (this.modelicaPath in inputs) {
      return inputs;
    }
    // if a replaceable and in modification store - use that type
    // if not in mod store, use 'this.type'
    const typeInstance = typeStore.get(this.type) || null;
    const typeInputs = typeInstance ? typeInstance.getInputs({}, false) : {};
    const visible = setInputVisible(typeInputs[this.type], this);
    let childInputs =
      this.enable === false || this.deadEnd
        ? []
        : typeInputs[this.type]?.inputs || [];

    childInputs.filter((typeInputs) => {
      const element = typeStore.get(typeInputs);
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
      replaceable: this.replaceable,
    };

    if (recursive) {
      if (typeInstance) {
        inputs = typeInstance.getInputs(inputs);
      }
    }

    return inputs;
  }
}

export class Enumeration extends Element {
  // Should extend ShortCLass
  enumList: {
    modelicaPath: string;
    identifier: string;
    description: string;
  }[] = [];
  description: string = "";

  constructor(
    definition: any,
    basePath: string,
    public elementType: ElementType,
  ) {
    super();
    const specifier = (definition.class_definition ?? definition)
      .class_specifier.short_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.type = this.modelicaPath;
    this.description = specifier.value.description.description_string;
    this.replaceable = definition.replaceable;
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
      replaceable: this.replaceable,
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
          replaceable: false,
        }),
    );

    return inputs;
  }
}

// Inherited properties by type with modifications
export class Extend extends Element {
  mods: Modification[] = [];
  type: string = "";
  annotation: Modification[] = [];

  constructor(
    definition: any,
    basePath: string,
    public elementType: ElementType,
  ) {
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
    }

    this.deadEnd = this.getLinkageKeywordValue() === false;
    const registered = this.registerPath(this.modelicaPath, this.type);
    if (!registered) {
      return; // PUNCH-OUT!
    }

    if (definition.extends_clause.class_modification) {
      this.mods = getModificationList(
        definition.extends_clause,
        basePath,
        this.type,
      );
    }
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

  constructor(
    definition: any,
    basePath: string,
    public elementType: ElementType,
  ) {
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
   * by the LongClass that uses them. So this function is a noop
   */
  getInputs(inputs: { [key: string]: TemplateInput } = {}, recursive = true) {
    return inputs;
  }
}

/**
 * Given a list of elements, discovers and returns the formatted type
 *
 * @param definition - Object from stored_class_definitions array or from element_list array
 * @param basePath - Class name from 'within' clause if parsing a class, or class name if parsing an element
 * @returns An Element instance or undefined if element type cannot be determined
 */
function _constructElement(
  definition: any,
  basePath: string,
): Element | undefined {
  const extend = "extends_clause";
  const component = "component_clause";
  const importClause = "import_clause";

  // From https://specification.modelica.org/maint/3.6/introduction1.html#some-definitions
  // an element can be either a class (or short class) definition
  // of the kind 'type', 'model', 'package', 'block', 'record', etc. or
  // an extends_clause, or
  // a component_clause (basically a variable or an instance of a class)
  let elementType: ElementType | undefined;

  const classPrefixes =
    definition.class_definition?.class_prefixes ?? definition.class_prefixes;
  if (classPrefixes != null) {
    // Class (or short class) definition
    elementType = classPrefixes
      .replace("partial ", "")
      .replace("expandable ", "");
  } else if (extend in definition) {
    elementType = extend;
  } else if (component in definition) {
    elementType = component;
  } else if (importClause in definition) {
    elementType = importClause;
  } else {
    // Undefined element type: PUNCH-OUT!
    return;
  }

  let element: Element | undefined;

  switch (elementType) {
    case "type":
      // May only be predefined types, enumerations, array of type, or classes extending from type.
      // Synctatically, these are short class definitions, but they need to be treated specifically
      // as they define enumerations that are used in the parameter dialogs.
      element = new Enumeration(definition, basePath, elementType);
      break;
    case "class":
    case "connector":
    case "model":
    case "block":
    case "record":
    case "package":
      const classSpecifier =
        definition.class_specifier ?? // object from stored_class_definitions array
        definition.class_definition.class_specifier; // object from element_list array
      if (classSpecifier.hasOwnProperty("long_class_specifier")) {
        element = new LongClass(definition, basePath, elementType);
      } else if (classSpecifier.hasOwnProperty("short_class_specifier")) {
        // Suffix "-short" is added to identify short class definitions that are ***not*** type definitions.
        element = new ShortClass(definition, basePath, `${elementType}-short`);
      }
      break;
    case extend:
      element = new Extend(definition, basePath, elementType);
      break;
    case component:
      element = new Component(definition, basePath, elementType);
      break;
    case importClause:
      element = new Import(definition, basePath, elementType);
      break;
  }

  const result = element?.duplicate
    ? typeStore.get(element?.modelicaPath)
    : element;

  return result;
}

//
export class File {
  public package = ""; // only important part of a file
  public elementList: Element[] = [];
  constructor(obj: any, className: string) {
    this.package = obj.within;
    const splitFilePath = className.split(".");
    if (this.package) {
      // FIXME: The assumption below is not consistent with MLS.
      // A one-to-one relationship between class names and file paths cannot be generically assumed.
      // See https://github.com/lbl-srg/ctrl-flow-dev/issues/413
      //
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

    obj.stored_class_definitions.map((cd: any) => {
      const element = _constructElement(cd, this.package);
      if (element) {
        this.elementList.push(element);
      }
    });
  }
}

/**
 * Extracts the given file into the type store
 * @param filePath - The ***relative*** path to the file to load (e.g. "Buildings/Templates/File")
 */
export const getFile = (className: string) => {
  const jsonData = loader(className);
  if (jsonData) {
    return new File(jsonData, className);
  }
};

/**
 * Searches a package for templates, then loads the file
 * creating template instances.
 * @param packageName - The full class name of the package to load (e.g. "Library.Package.SubPackage")
 */
export const loadPackage = (packageName: string) => {
  const entryPoints = findPackageEntryPoints(packageName);
  entryPoints?.map(({ json, className }) => new File(json, className));

  // Attempt to load project settings from a pre-defined path
  const projectPath = "Buildings.Templates.Data.AllSystems";
  getFile(projectPath);
};
