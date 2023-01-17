/**
 * Templates are the intended point of interaction with the parser.
 *
 * Templates sit in front of all parsed elements that represent a single template
 * and provide accessor methods to extract what is needed in linkage schema format
 *
 * Templates hold logic to understand multiple parsed elements as a cohesive template
 *
 */

import * as parser from "./parser";
import { evaluateExpression, Expression, Literal } from "./expression";
import { Modification } from "./modification";

const templateStore = new Map<string, Template>();
const systemTypeStore = new Map<string, SystemTypeN>();

export function getTemplates() {
  return [...templateStore.values()];
}

export function getSystemTypes() {
  return [...systemTypeStore.values()];
}

export function getProject(): Project {
  const { modelicaPath } = parser.getProject() as parser.TemplateInput;
  return { modelicaPath };
}

type Options = { [key: string]: Option };
type ScheduleOptions = { [key: string]: ScheduleOption };

export function getOptions(): {
  options: Option[];
  scheduleOptions: ScheduleOption[];
} {
  const templates = [...templateStore.values()];

  let allConfigOptions = {};
  let allScheduleOptions = {};

  templates.map((t) => {
    const { options, scheduleOptions } = t.getOptions();
    allConfigOptions = { ...allConfigOptions, ...options };
    allScheduleOptions = { ...allScheduleOptions, ...scheduleOptions };
  });

  // append project options
  const projectOptions: { [key: string]: Option } = {};
  Object.entries(parser.createProjectInputs()).map(
    ([key, input]) => (projectOptions[key] = _mapInputToOption(input)),
  );
  allConfigOptions = { ...allConfigOptions, ...projectOptions };

  return {
    options: Object.values(allConfigOptions),
    scheduleOptions: Object.values(allScheduleOptions),
  };
}

export interface Option {
  type: string;
  name: string;
  modelicaPath: string;
  visible: boolean;
  options?: string[];
  group?: Literal | string;
  tab?: string;
  value?: any;
  enable?: any;
  treeList?: string[];
  modifiers: { [key: string]: { expression: Expression; final: boolean } };
  choiceModifiers?: { [key: string]: Mods };
  replaceable: boolean;
  elementType: string;
  definition: boolean;
}

export interface Project {
  modelicaPath: string;
}

export interface ScheduleOption extends Option {
  groups: string[];
}

export interface Mods {
  [key: string]: { expression: Expression; final: boolean };
}

/**
 * Maps the nested modifier structure into a flat dictionary
 */
export function flattenModifiers(
  modList: (Modification | undefined | null)[] | undefined,
  mods: {
    [key: string]: {
      expression: Expression;
      final: boolean;
      redeclare: boolean;
    };
  } = {},
) {
  if (!modList) {
    return mods; // PUNCH-OUT!
  }

  modList
    .filter((m) => m !== undefined || m !== null)
    .map((mod) => {
      if (mod?.value) {
        mods[mod.modelicaPath] = {
          expression: mod.value,
          final: mod.final,
          redeclare: mod.redeclare,
        };
      }

      if (mod?.mods) {
        flattenModifiers(mod.mods, mods);
      }
    });

  return mods;
}

function _getTreeList(option: Option) {
  const treeList: string[] = [option.type];

  option.options?.map((o) => {
    // remove the last '.' path
    const basePath = o.split(".").slice(0, -1).join(".");

    if (!treeList.includes(basePath)) {
      treeList.push(basePath);
    }
  });

  return treeList;
}

/**
 * Maps an input to the expected 'option' shape for the front end
 */
function _mapInputToOption(input: parser.TemplateInput): Option {
  const keysToRemove = ["elementType", "inputs"];
  const options = input.inputs;

  const option = Object.fromEntries(
    Object.entries(input).filter(([key]) => !keysToRemove.includes(key)),
  ) as Option;

  if (input.modifiers) {
    const flattenedMods = flattenModifiers(input.modifiers);
    delete flattenedMods[input.modelicaPath]; // don't include 'default path'
    option.modifiers = flattenedMods;
  }

  if (input.choiceModifiers) {
    // map from choice value to modifiers
    const flattenedChoiceMods: { [key: string]: Mods } = {};

    Object.entries(input.choiceModifiers).map(([key, modList]) => {
      flattenedChoiceMods[key] = flattenModifiers(modList);
    });
    option.choiceModifiers = flattenedChoiceMods;
  }

  option.options = options;
  option.definition = parser.isDefinition(input.elementType);
  option.replaceable = input.elementType === "replaceable";

  if (option.definition) {
    option.treeList = _getTreeList(option);
  }

  return option;
}

export interface SystemTypeN {
  description: string;
  modelicaPath: string;
}

export interface SystemTemplateN {
  modelicaPath: string;
  pathModifiers: { [key: string]: string };
  scheduleOptionPaths: string[];
  systemTypes: string[];
  name: string;
}

export interface ModifiersN {
  modelicaPath: string;
  value: any;
}

export class Template {
  scheduleOptionPaths: string[] = [];
  options: Options = {};
  scheduleOptions: ScheduleOptions = {};
  systemTypes: SystemTypeN[] = [];
  mods: { [key: string]: Expression } = {};
  pathMods: { [key: string]: string } = {};

  constructor(public element: parser.Element) {
    this._extractSystemTypes(element);
    this._extractOptions(element);
    this._extractPathMods(element);
    templateStore.set(this.modelicaPath, this);
  }

  get modelicaPath() {
    return this.element.modelicaPath;
  }

  get description() {
    return this.element.description;
  }

  _extractSystemTypes(element: parser.Element) {
    const path = element.modelicaPath.split(".");
    path.pop();
    while (path.length) {
      const type = parser.findElement(path.join("."));
      if (type && type.entryPoint) {
        const systemType = {
          description: type.description,
          modelicaPath: type.modelicaPath,
        };
        this.systemTypes.unshift(systemType);
        systemTypeStore.set(type.modelicaPath, systemType);
      }
      path.pop();
    }
  }

  _findRedeclareTypesHelper(
    mods: Modification[],
    redeclareTypes: { [key: string]: null },
  ) {
    mods.map((m) => {
      if (m.redeclare) {
        const redeclareType = evaluateExpression(m.value);
        redeclareTypes[redeclareType] = null;
      }
      if (m.mods) {
        this._findRedeclareTypesHelper(m.mods, redeclareTypes);
      }
    });
  }

  /**
   * Iterates through every modifier, finding any 'redeclare' modifiers
   */
  _findRedeclareTypes(inputs: { [key: string]: parser.TemplateInput }) {
    const redeclaredTypes: { [key: string]: null } = {};
    Object.values(inputs)
      .filter((i) => i.modifiers !== undefined)
      .map((input) => {
        if (input.modifiers) {
          this._findRedeclareTypesHelper(input.modifiers, redeclaredTypes);
        }
      });

    return Object.keys(redeclaredTypes);
  }

  _extractOptions(element: parser.Element) {
    let inputs = element.getInputs();
    const redeclaredInputs = this._findRedeclareTypes(inputs)
      .map((t) => parser.typeStore.get(t))
      .filter((element) => element !== undefined)
      .reduce((acc, element) => {
        return element ? { ...acc, ...element.getInputs() } : acc;
      }, {}) as { [key: string]: parser.TemplateInput };

    inputs = { ...inputs, ...redeclaredInputs };

    const datEntryPoints = Object.values(inputs).filter((i) => {
      return i.modelicaPath.endsWith(".dat");
    });

    this.scheduleOptionPaths = datEntryPoints.map((i) => i.modelicaPath);

    this.options = {};
    Object.entries(inputs).map(([key, input]) => {
      this.options[key] = _mapInputToOption(input);
    });

    // kludge: 'Modelica.Icons.Record' is useful for schematics but
    // never for 'Options'
    const modelicaIconsPath = "Modelica.Icons.Record";
    delete this.scheduleOptions[modelicaIconsPath];
    delete this.options[modelicaIconsPath];
  }

  _extractPathModHelper(
    element: parser.Element,
    instancePrefix: string,
    inner: { [key: string]: string },
    pathMods: { [key: string]: string },
  ) {
    if (parser.isDefinition(element.elementType)) {
      if (parser.isInputGroup(element.elementType)) {
        const inputGroup = element as parser.InputGroup;
        const childElements = inputGroup.getChildElements();
        // breadth first - check all class params first, then dive into types
        childElements.map((el) => {
          this._extractPathModHelper(el, instancePrefix, inner, pathMods);
        });

        childElements.map((el) => {
          const typeElement = parser.typeStore.get(el.type, "", false);
          // primitive types return undefined
          if (typeElement) {
            let newPrefix = [instancePrefix, el.name]
              .filter((p) => p !== "")
              .join(".");
            this._extractPathModHelper(typeElement, newPrefix, inner, pathMods);
          }
        });
      }
    } else {
      // TODO: I could be fouling up inner/outer resolution by checking ALL subcomponents
      // against eachother
      const param = element as parser.Input;
      const path = [instancePrefix, param.name]
        .filter((p) => p !== "")
        .join(".");
      if (param.inner && !(path in inner)) {
        // key: just the param name, value: the full path
        inner[param.name] = path; // inner declarations resolve just by param name NOT the full instance path
        if (path in pathMods && pathMods[path] !== undefined) {
          pathMods[path] = inner[path];
        }
      }

      if (param.outer) {
        // check special case for if path is 'datAll'
        if (param.name.endsWith("datAll")) {
          pathMods[path] = "datAll";
        } else {
          pathMods[path] = inner[param.name]; // OK if undefined
        }
      }
    }
  }

  _extractPathMods(element: parser.Element) {
    const innerNodes: { [key: string]: string } = {};
    const pathMods: { [key: string]: string } = {};

    this._extractPathModHelper(element, "", innerNodes, pathMods);
    this.pathMods = pathMods;
  }

  getOptions() {
    return { options: this.options, scheduleOptions: {} };
  }

  getSystemTypes() {
    return this.systemTypes;
  }

  getSystemTemplate(): SystemTemplateN {
    return {
      modelicaPath: this.modelicaPath,
      scheduleOptionPaths: this.scheduleOptionPaths,
      systemTypes: this.systemTypes.map((t) => t.modelicaPath),
      pathModifiers: this.pathMods,
      name: this.description,
    };
  }
}
