/**
 * Templates are the intended point of interaction with the parser.
 *
 * Templates sit in front of all parsed elements that represent a single template
 * and provide accessor methods to extract what is needed in linkage schema format
 *
 * Templates hold logic to understand multiple parsed elements as a cohesive template
 */

import * as parser from "./parser";
import { Expression, Literal } from "./expression";
import { Modification } from "./modification";

const templateStore = new Map<string, Template>();
const systemTypeStore = new Map<string, SystemTypeN>();

export function getTemplates() {
  return [...templateStore.values()];
}

export function getSystemTypes() {
  return [...systemTypeStore.values()];
}

type Options = { [key: string]: Option };
type ScheduleOptions = { [key: string]: ScheduleOption };

export function getOptions(): {
  options: parser.TemplateInput[];
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

  return {
    options: Object.values(allConfigOptions),
    scheduleOptions: Object.values(allScheduleOptions),
  };
}

interface Option {
  type: string;
  name: string;
  modelicaPath: string;
  visible: boolean;
  inputs?: string[];
  group?: Literal | string;
  tab?: string;
  value?: any;
  enable?: any;
  modifier?: Mod;
  elementType: string;
}

export interface ScheduleOption extends Option {
  groups: string[];
}

interface Mod {
  [key: string]: Mod | Expression
}

/**
 * Extracts the modifier from a TemplateInput and maps it to the 'Mod' format
 * 
 */
function _mapToMod(modifier: Modification | undefined, inputs: {[key: string]: parser.TemplateInput}): Mod {
  let mod: Mod = {};
  if (modifier?.value) {
    mod = {[modifier.modelicaPath]: modifier.value}
  } else if (modifier) {
    // check for nested modifiers
    const input = inputs[modifier.modelicaPath];
    if (input) {
      modifier.mods.map(m => {
        const path = `${input.modelicaPath}.${m.name}`;
        const nestedModifier = inputs[path]?.modifier;
        if (nestedModifier) {
          mod[path] = _mapToMod(nestedModifier, inputs);
        }
      });
    }
  }

  return mod;
}

function _mapInputToOption(input: parser.TemplateInput, inputs: {[key:string]: parser.TemplateInput}): Option {
  const keysToRemove = ['elementType'];

  const option = Object.fromEntries(
    Object.entries(input)
          .filter(([key]) => !(key in keysToRemove))
  ) as Option;

  option.modifier = _mapToMod(input.modifier, inputs);
  return option;
}

function _extractScheduleOptionHelper(scheduleOptions: {[key: string]: ScheduleOption}, inputs: {[key: string]: parser.TemplateInput}, inputPath: string, groups: string[]=[]) {
  const input = inputs[inputPath];
  // get the type. If the 'type' is a record do record things if not, treat as a param
  const inputType = inputs[input.type];

  // TODO: fix issues with building group list:
  // 1. param description and Record description: we only need one of these
  // 2. Root record description doesn't need to be added 

  // `Modelica.Icons.Record` is often the class being extended
  // and this class does not generate an option
  if (inputType && inputType.elementType === 'record') {    
    const groupList =[...groups, input.modelicaPath];
    input.inputs?.map(i => _extractScheduleOptionHelper(
      scheduleOptions,
      inputs,
      i,
      groupList));
  }

  scheduleOptions[input.modelicaPath] = {..._mapInputToOption(input, inputs), groups};
}

/**
 * Attempts to find the 'dat' element, then follows the tree
 * of options connected to that 'dat'
 */
function _extractScheduleOptions(modelicaPath: string) {
  // try and find 'dat'
  let curPath = modelicaPath;
  let dat: parser.Element | undefined | null = null;
  const scheduleOptions: ScheduleOptions = {};

  while (!dat) {
    dat = parser.findElement(`${curPath}.dat`);
    if (dat) {
      break;
    } else {
      const extendElement = parser.findElement(`${curPath}.${parser.EXTEND_NAME}`);
      if (!extendElement) {
        break; // bottomed out, 'dat' not found - PUNCH-OUT!
      }
      // use extend 'type' to get to extend class options
      curPath = extendElement.type;
    }
  }


  if (dat) {
    const inputs = dat.getInputs();
    let optionRoot = _mapInputToOption(inputs[dat.modelicaPath], inputs);
    scheduleOptions[dat.modelicaPath] = {...optionRoot, groups: []};

    optionRoot.inputs?.map(i => _extractScheduleOptionHelper(
      scheduleOptions,
      inputs,
      i));
  }

  return scheduleOptions;
}

export interface SystemTypeN {
  description: string;
  modelicaPath: string;
}

export interface SystemTemplateN {
  modelicaPath: string;
  scheduleOptionPath: string;
  systemTypes: string[];
  name: string;
}

export interface ModifiersN {
  modelicaPath: string;
  value: any;
}

export class Template {
  scheduleOptionPath: string = "";
  options: Options = {};
  scheduleOptions: ScheduleOptions = {};
  systemTypes: SystemTypeN[] = [];

  constructor(public element: parser.Element) {
    this._extractSystemTypes(element);
    this._extractOptions();
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

  _extractOptions() {
    const inputs = this.element.getInputs();
    this.scheduleOptions = _extractScheduleOptions(this.modelicaPath);
    Object.keys(this.scheduleOptions).map(k => delete inputs[k]);
    this.options = {};
    Object.entries(inputs).map(([key, input]) => {
      this.options[key] = _mapInputToOption(input, inputs);
    });


    // kludge: 'Modelica.Icons.Record' is useful for schematics but
    // never for 'Options'
    const modelicaIconsPath = "Modelica.Icons.Record";
    delete this.scheduleOptions[modelicaIconsPath];
    delete this.options[modelicaIconsPath];
  }

  getOptions() {
    return { options: this.options, scheduleOptions: this.scheduleOptions };
  }

  getSystemTypes() {
    return this.systemTypes;
  }

  getSystemTemplate(): SystemTemplateN {
    return {
      modelicaPath: this.modelicaPath,
      scheduleOptionPath: this.scheduleOptionPath,
      systemTypes: this.systemTypes.map((t) => t.modelicaPath),
      name: this.description,
    };
  }

  getModifiers(): ModifiersN[] {
    const mods = this.element.getModifications();

    return mods
      .filter((m) => m.mods.length === 0)
      .map((m) => ({
        modelicaPath: m.modelicaPath,
        value: m.value,
      }));
  }
}
