import * as parser from "./parser";

const templateStore = new Map<string, Template>();
const systemTypeStore = new Map<string, SystemType>();

export function getTemplates() {
  return templateStore.values();
}

export function getSystemTypes() {
  return systemTypeStore.values();
}

export interface SystemType {
  description: string;
  modelicaPath: string;
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
        }
        this.systemTypes.push(systemType);
        systemTypeStore.set(type.modelicaPath, systemType);
      }
      path.pop();
    }

    templateStore.set(this.modelicaPath, this);
  }

  get modelicaPath() {
    return this.element.modelicaPath;
  }

  getOptions() {
    return this.element.getOptions();
  }

  getSystemTypes() {
    return this.systemTypes;
  }
}
