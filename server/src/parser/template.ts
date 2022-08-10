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

  _processScheduleOptionNode(scheduleOptions: {[key: string]: parser.ScheduleOption}, node: parser.TemplateInput, group: string[]) {
    let current = node;
    const element = parser.findElement(node.modelicaPath);

    if (element) {
      // check if record
    }
  }

  _extractScheduleOptions(dat: parser.Element) {
    const options = dat.getInputs();
    let optionRoot = options[dat.modelicaPath];
    const scheduleOptions: {[key: string]: parser.ScheduleOption} = {};
    // go through each child option
    // if record, add path to groups list
      // go through options
      // pop off group from group list
    // if input, add option + groups to scheduleOptions
    const groups:string[] = [];
    while (optionRoot) {
      scheduleOptions[optionRoot.modelicaPath] = {...optionRoot, groups};

      // go through each child option
    }
  }

  // Finds 'dat' as entry point for schedule options
  // recursively steps through each child of 'dat' to extract
  // schedule options in it
  // Then finds all options and removes all options that already are in
  // 'scheduleOptions'
  _extractOptions(): {
    options: { [key: string]: parser.TemplateInput };
    scheduleOptions: { [key: string]: parser.ScheduleOption };
  } {
    // try and find 'dat'
    let curPath = this.modelicaPath;
    let element: parser.Element | undefined | null = null;

    while (!element) {
      element = parser.findElement(`${curPath}.dat`);
      if (element) {
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

    if (element) {
      // dat found
      // call get scheduleOptions
      const typeDef = parser.findElement(element.type);
      const options = element.getInputs();
    }

    return { options: {}, scheduleOptions: {} };
  }

  /* Descends tree of options removing all nodes that originate
   * from the 'dat' parameter and assigns that parameter to a
   * schedule options dictionary
   */
  splitOptions(
    path: string,
    options: { [key: string]: parser.TemplateInput },
    scheduleOptions: { [key: string]: parser.ScheduleOption },
  ) {
    if (path in scheduleOptions) {
      return; // BREAK-OUT: path already split out
      // TODO: this is necessary if 'dat' records re-use types
    }
    const option = options[path];

    // TODO: build up group list
    scheduleOptions[path] = { groups: [], ...option };
    delete options[option.modelicaPath];

    // option.options?.map((o) => this.splitOptions(o, options, scheduleOptions));
  }

  getOptions() {
    const options = this.element.getInputs();
    const scheduleOptions: { [key: string]: parser.ScheduleOption } = {};

    // try and find 'dat' param by checking the class definition,
    // then going through each extended class
    let curPath = this.modelicaPath;
    let dat: parser.TemplateInput | null = null;

    while (!dat) {
      dat = options[`${curPath}.dat`];

      if (dat) {
        // NOTE: we could just remove 'dat' as a child option preventing
        // traversal to all schedule table related options instead of going
        // through and deleting keys if we run into issues with performance
        break;
      } else {
        curPath = `${curPath}.${parser.EXTEND_NAME}`;
        if (!(curPath in options)) {
          break;
        }
        const extendOption = options[curPath];
        // use extend 'type' to get to extend class options
        curPath = extendOption.type;
      }
    }

    if (dat) {
      this.scheduleOptionPath = dat.modelicaPath;
      this.splitOptions(dat.modelicaPath, options, scheduleOptions);
    }

    return { options, scheduleOptions };
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
