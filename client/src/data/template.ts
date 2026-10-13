import tplData from "./templates.json";
import RootStore from ".";
import { Modifiers } from "../utils/modifier-helpers";
import type { Expression } from "../interpreter/interpreter";

export interface TemplateInterface {
  modelicaPath: string;
  name: string;
  systemTypes: string[];
  options?: string[];
  pathModifiers?: { [key: string]: string | undefined };
}

export interface OptionInterface {
  modelicaPath: string;
  type: string;
  name: string;
  value?: string | boolean | null | number | Expression;
  group?: string;
  tab?: string;
  visible?: boolean;
  options?: string[];
  valueExpression?: any; //{ expression: string; modelicaPath: string };
  /** Never synthesized to `false` by the parser: undefined for non-selectable
   * composite groups; a defined value evaluating to false (explicit
   * Dialog(enable=...) annotation or dead end) disables the whole subtree of
   * an instance of this option. */
  enable?: any; // { modelicaPath: string; expression: string };
  modifiers?: any;
  choiceModifiers?: { [key: string]: Modifiers | undefined };
  /** Modifiers of the constraining clause of a replaceable element: only
   * these apply to a redeclaration (MLS 7.3.2). Undefined if there is no
   * constraining clause. */
  constrainingModifiers?: Modifiers;
  treeList?: string[];
  definition: boolean;
  shortExclType: boolean; // Short class definition excluding `type` definition
  replaceable: boolean;
  /** True if value is a binding to a record type component */
  recordBinding?: boolean;
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

  getIconForSystem(systemPath: string): string | undefined {
    const match = icons.find((item) => item.systemPath === systemPath);
    return match ? match.iconClass : "";
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
