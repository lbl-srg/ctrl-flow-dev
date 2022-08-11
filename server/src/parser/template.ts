/**
 * Templates are the intended point of interaction with the parser.
 *
 * Templates sit in front of all parsed elements that represent a single template
 * and provide accessor methods to extract what is needed in linkage schema format
 *
 * Templates hold logic to understand multiple parsed elements as a cohesive template
 */

import * as parser from "./parser";

const templateStore = new Map<string, Template>();
const systemTypeStore = new Map<string, SystemTypeN>();

export function getTemplates() {
  return [...templateStore.values()];
}

export function getSystemTypes() {
  return [...systemTypeStore.values()];
}

type Options = { [key: string]: parser.TemplateInput };
type ScheduleOptions = { [key: string]: parser.ScheduleOption };

export function getOptions(): {
  options: parser.TemplateInput[];
  scheduleOptions: parser.ScheduleOption[];
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



function _mapInputsToOptions(inputs: {[key: string]: parser.TemplateInput}) {
  const keysToRemove = ['elementType'];
  const options: {[key: string]: parser.TemplateInput} = {};

  Object.entries(inputs).map(([key, option]) => {
    options[key] = Object.fromEntries(
      Object.entries(option)
            .filter(([key]) => !(key in keysToRemove))
    ) as parser.TemplateInput
  });

  return options;
}

function _extractScheduleOptionHelper(scheduleOptions: {[key: string]: parser.ScheduleOption}, inputs: {[key: string]: parser.TemplateInput}, inputPath: string, groups: string[]=[]) {
  const input = inputs[inputPath];
  // get the type. If the 'type' is a record do record things if not, treat as a param
  const inputType = inputs[input.type];

  // `Modelica.Icons.Record` is often the class being extended
  // and this class does not generate an option
  if (inputType && inputType.elementType === 'record') {
    const groupList =[...groups, input.modelicaPath];
    input.inputs?.map(i => _extractScheduleOptionHelper(
      scheduleOptions,
      inputs,
      i,
      groupList));
  } else {
    scheduleOptions[input.modelicaPath] = {...input, groups};
  }
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
    let inputRoot = inputs[dat.modelicaPath];
    scheduleOptions[dat.modelicaPath] = {...inputRoot, groups: []};

    inputRoot.inputs?.map(i => _extractScheduleOptionHelper(
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
    this.scheduleOptions = _extractScheduleOptions(this.modelicaPath);
    const inputs = this.element.getInputs();
    Object.keys(this.scheduleOptions).map(k => delete inputs[k]);
    this.options = _mapInputsToOptions(inputs);

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
