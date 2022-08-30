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
  modifiers: { [key: string]: Expression };
  replaceable: boolean;
  elementType: string;
}

export interface ScheduleOption extends Option {
  groups: string[];
}

export interface Mods {
  [key: string]: Expression;
}

export function flattenModifiers(
  modList: (Modification | undefined | null)[] | undefined,
  mods: { [key: string]: Expression } = {},
) {
  if (!modList) {
    return mods; // PUNCH-OUT!
  }

  modList
    .filter((m) => m !== undefined || m !== null)
    .map((mod) => {
      if (mod?.value) {
        mods[mod.modelicaPath] = mod.value;
      }

      if (mod?.mods) {
        flattenModifiers(mod.mods, mods);
      }
    });

  return mods;
}

function _mapInputToOption(
  input: parser.TemplateInput,
  inputs: { [key: string]: parser.TemplateInput },
): Option {
  const keysToRemove = ["elementType", "inputs"];
  const options = input.inputs;
  // TODO: this filter is not working
  const option = Object.fromEntries(
    Object.entries(input).filter(([key]) => !(key in keysToRemove)),
  ) as Option;

  if (input.modifiers) {
    option.modifiers = flattenModifiers(input.modifiers);
  }

  option.options = options;

  return option;
}

function _extractScheduleOptionHelper(
  scheduleOptions: { [key: string]: ScheduleOption },
  inputs: { [key: string]: parser.TemplateInput },
  inputPath: string,
  groups: string[] = [],
) {
  const input = inputs[inputPath];
  // get the type. If the 'type' is a record do record things if not, treat as a param
  const inputType = inputs[input.type];

  // TODO: fix issues with building group list:
  // 1. param description and Record description: we only need one of these
  // 2. Root record description doesn't need to be added

  // `Modelica.Icons.Record` is often the class being extended
  // and this class does not generate an option
  if (inputType && inputType.elementType === "record") {
    const groupList = [...groups, input.modelicaPath];
    input.inputs?.map((i) =>
      _extractScheduleOptionHelper(scheduleOptions, inputs, i, groupList),
    );
  }

  scheduleOptions[input.modelicaPath] = {
    ..._mapInputToOption(input, inputs),
    groups,
  };
}

/**
 * Attempts to find the 'dat' element, then follows the tree
 * of options connected to that 'dat'
 * 
 * TODO: change this to generic dat split - when a 'dat' is found
 * pass in the path and let it split things out
 */
function _extractScheduleOptions(dat: parser.TemplateInput, inputs: {[key: string]: parser.TemplateInput}) {
  const scheduleOptions: ScheduleOptions = {};
  dat.inputs?.map(i => {
    _extractScheduleOptionHelper(scheduleOptions, inputs, i)
  })
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
  modifiers: { [key: string]: Expression } = {};

  constructor(public element: parser.Element) {
    this._extractSystemTypes(element);
    this._extractOptions(element);
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

  _extractOptions(element: parser.Element) {
    let scheduleOptions: ScheduleOptions = {};
    const inputs = element.getInputs();
    
    // find dat entry points
    Object.values(inputs).filter(i => {
      return i.elementType === 'record' && i.name === 'dat'
    }).map(i => {
      scheduleOptions = {...scheduleOptions, ..._extractScheduleOptions(i, inputs)};
    });

    this.scheduleOptions = scheduleOptions
    Object.keys(this.scheduleOptions).map((k) => delete inputs[k]);
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
}
