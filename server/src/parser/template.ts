/**
 * Templates are the intended point of interaction with the parser.
 *
 * Templates sit in front of all parsed elements that represent a single template
 * and provide accessor methods to extract what is needed in linkage schema format
 */

import { access } from "fs";
import * as parser from "./parser";

const templateStore = new Map<string, Template>();
const systemTypeStore = new Map<string, SystemTypeN>();

export function getTemplates() {
  return [...templateStore.values()].map((t) => t.getSystemTemplate());
}

export function getSystemTypes() {
  return [...systemTypeStore.values()];
}

export function getOptions(): parser.OptionN[] {
  const templates = [...templateStore.values()];

  // [{'asdf': OptionN}, {'asdf': OptionN}, {}]
  const options = templates.reduce(
    (acc: { [key: string]: parser.OptionN }, currentValue) => {
      return { ...acc, ...currentValue.getOptions() };
    },
    {},
  );
  const optionsList = Object.values(options);

  return optionsList;
}

export interface SystemTypeN {
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

    return mods
      .filter((m) => m.mods.length === 0)
      .map((m) => ({
        modelicaPath: m.modelicaPath,
        value: m.value,
      }));
  }
}
