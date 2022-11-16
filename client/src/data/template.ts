import tplData from "./templates.json";
import RootStore from ".";
import { buildModifiers, Modifiers } from '../utils/modifier-helpers';

export interface TemplateInterface {
  modelicaPath: string;
  name: string;
  systemTypes: string[];
  options?: string[];
}

export interface OptionInterface {
  modelicaPath: string;
  type: string;
  name: string;
  value?: string | boolean | null | number;
  group?: string;
  tab?: string;
  visible?: boolean;
  options?: string[];
  childOptions?: OptionInterface[];
  valueExpression?: any; //{ expression: string; modelicaPath: string };
  enable?: any; // { modelicaPath: string; expression: string };
  modifiers: any;
  treeList: string[];
  definition: boolean;
}

export interface SystemTypeInterface {
  description: string;
  modelicaPath: string;
}

const icons = [
  {
    iconClass: "icon-ahu",
    systemPath: "",
  },

  {
    iconClass: "icon-zone-equipment",
    systemPath: "",
  },

  {
    iconClass: "icon-chiller-plant",
    systemPath: "",
  },

  {
    iconClass: "icon-boiler-plant",
    systemPath: "",
  },
];

export default class Template {
  templates: TemplateInterface[];
  options: OptionInterface[];
  systemTypes: SystemTypeInterface[];
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.templates = tplData.templates;
    this.options = tplData.options;
    this.systemTypes = tplData.systemTypes;
    this.rootStore = rootStore;
  }

  getTemplateByPath(path: string): TemplateInterface | undefined {
    return this.templates.find((tpl) => tpl.modelicaPath === path);
  }

  getTemplatesForSystem(path: string): TemplateInterface[] {
    return this.templates.filter((tpl) => tpl.systemTypes.includes(path));
  }

  getActiveTemplatesForSystem(systemPath: string): TemplateInterface[] {
    return this.getTemplatesForSystem(systemPath).filter((tpl) =>
      this.rootStore.configStore.hasSystemTemplateConfigs(
        systemPath,
        tpl.modelicaPath,
      ),
    );
  }

  getSystemTypeByPath(path: string): SystemTypeInterface | undefined {
    return this.systemTypes.find(
      (systemType) => systemType.modelicaPath === path,
    );
  }

  get nestedOptions(): OptionInterface[] {
    const allOptions = this.options;

    return this.options.map((option) => {
      if (option.options) {
        option.childOptions = option.options.reduce((acc, path) => {
          const match = allOptions.find((opt) => opt.modelicaPath === path);
          return match ? acc.concat(match) : acc;
        }, [] as OptionInterface[]);
      }

      return option;
    });
  }

  getIconForSystem(systemPath: string): string | undefined {
    const match = icons.find((item) => item.systemPath === systemPath);
    return match ? match.iconClass : "";
  }

  getOptionsForTemplate(path: string): OptionInterface[] {
    return this.nestedOptions.filter((opt) => opt.modelicaPath === path);
  }

  getModifiersForTemplate(path: string): Modifiers {
    const templateOption = this.options.find(
      (opt) => opt.modelicaPath === path,
    ) as OptionInterface;
    return buildModifiers(templateOption, "", {}, this.options);
  }

  getAllOptions(): OptionInterface[] {
    return this.options;
  }

  getOption(path: string): OptionInterface {
    return this.options.filter((opt) => opt.modelicaPath === path)[0];
  }
}
