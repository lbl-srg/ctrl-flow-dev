/**
 * Templates are the intended point of interaction with the parser.
 *
 * Templates sit in front of all parsed elements that represent a single template
 * and provide accessor methods to extract what is needed in linkage schema format
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

type Options = { [key: string]: parser.OptionN };
type ScheduleOptions = { [key: string]: ScheduleOption };

export function getOptions(): {
  options: parser.OptionN[];
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

export interface ScheduleOption extends parser.OptionN {
  groups: string[];
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
    // extract system type by getting descriptions for each type
    const path = element.modelicaPath.split(".");
    path.pop();
    while (path.length) {
      const type = parser.typeStore.get(path.join("."));
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

    templateStore.set(this.modelicaPath, this);
  }

  get modelicaPath() {
    return this.element.modelicaPath;
  }

  get description() {
    return this.element.description;
  }

  /* Descends tree of options removing all nodes that originate
   * from the 'dat' parameter and assigns that parameter to a
   * schedule options dictionary
   */
  splitOptions(
    path: string,
    options: { [key: string]: parser.OptionN },
    scheduleOptions: { [key: string]: ScheduleOption },
  ) {
    const option = options[path];
    // TODO: determine how to build up group list
    scheduleOptions[path] = { groups: [], ...option };
    delete options[option.modelicaPath];

    option.options?.map((o) => this.splitOptions(o, options, scheduleOptions));
  }

  getOptions() {
    const options = this.element.getOptions();
    const scheduleOptions: { [key: string]: ScheduleOption } = {};

    // try and find 'dat' param by checking the class definition,
    // then going through each extended class
    let curPath = this.modelicaPath;
    let dat: parser.OptionN | null = null;

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
