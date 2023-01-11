import tplData from "./templates.json";
import RootStore from ".";
import { buildModifiers, Modifiers } from "../utils/modifier-helpers";

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
  choiceModifiers?: { [key: string]: Modifiers };
  treeList: string[];
  definition: boolean;
  replaceable: boolean;
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
  _mods: Modifiers | undefined; // internal cache so we don't recompute... doesn't help
  templates: TemplateInterface[];
  _templates: { [key: string]: TemplateInterface } = {};
  optionList: OptionInterface[];
  _options: { [key: string]: OptionInterface } = {};
  systemTypes: SystemTypeInterface[];
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.templates = tplData.templates;
    this.optionList = tplData.options;
    this.systemTypes = tplData.systemTypes;
    this.rootStore = rootStore;

    // create option dictionary for quick lookup
    this.optionList.map((o) => (this._options[o.modelicaPath] = o));
    // create template dictionary for quick lookup
    this.templates.map((o) => (this._templates[o.modelicaPath] = o));
  }

  getTemplateByPath(path: string | null): TemplateInterface | undefined {
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
    const allOptions = this.optionList;

    return this.optionList.map((option) => {
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

  getOptionsForProject(): OptionInterface[] {
    return this.nestedOptions.filter((opt) => opt.modelicaPath === "datAll");
  }

  getOptionsForTemplate(path: string): OptionInterface[] {
    return this.nestedOptions.filter((opt) => opt.modelicaPath === path);
  }

  getModifiersForTemplate(path: string): Modifiers {
    if (!this._mods) {
      const templateOption = this.optionList.find(
        (opt) => opt.modelicaPath === path,
      ) as OptionInterface;
      this._mods = buildModifiers(templateOption, "", {}, "", this._options);
    }

    return this._mods;
  }

  getAllTemplates() {
    return this._templates;
  }

  getAllOptions() {
    return this._options;
  }

  getOption(path: string) {
    return this._options[path];
  }
}
