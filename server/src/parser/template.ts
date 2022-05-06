import * as parser from "./parser";

const templateStore = new Map<string, Template>();
const systemTypeStore = new Map<string, SystemType>();

export function getTemplates() {
  return [...templateStore.values()];
}

export function getSystemTypes() {
  return [...systemTypeStore.values()];
}

export interface SystemType {
  description: string;
  modelicaPath: string;
}

export interface SystemTemplateN {
  modelicaPath: string;
  systemTypes: string[];
  name: string;
  options?: string[];
}

export interface ModifiersN {
  modelicaPath: string;
  value: any;
}

export class Template {
  systemTypes: SystemType[] = [];

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

  getOptions() {
    return this.element.getOptions();
  }

  getSystemTypes() {
    return this.systemTypes;
  }

  getSystemTemplate(): SystemTemplateN {
    return {
      modelicaPath: this.modelicaPath,
      systemTypes: this.systemTypes.map((t) => t.modelicaPath),
      name: this.description,
      options: Object.values(this.getOptions()).map((o) => o.modelicaPath),
    };
  }

  getModifiers(): ModifiersN[] {
    const mods = this.element.getModifications();

    return mods.map(m => ({
      modelicaPath: m.modelicaPath,
      value: m.value,
    }));
  }
}
