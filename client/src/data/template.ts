import RootStore from ".";
import { TemplateDataInterface } from "./types";
import { buildModifiers, Modifiers } from "../utils/modifier-helpers";
import {
  TemplateInterface,
  OptionInterface,
  SystemTypeInterface,
} from "./types";

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

export interface SystemTypeTreeNode {
  id: string;
  item: SystemTypeInterface;
  children: SystemTypeTreeNode[];
}

/** Build a forest (array of root nodes) from a flat list. */
export function buildSystemTypeForest(
  items: SystemTypeInterface[],
): SystemTypeTreeNode[] {
  // Index items and prepare children buckets
  const byId = new Map(items.map((it) => [it.modelicaPath, it]));
  const buckets = new Map<string, SystemTypeInterface[]>();
  items.forEach((it) => buckets.set(it.modelicaPath, []));

  const roots: SystemTypeInterface[] = [];
  for (const it of items) {
    const pid = it.parent ?? undefined;
    if (pid && byId.has(pid)) {
      buckets.get(pid)!.push(it);
    } else {
      roots.push(it);
    }
  }

  // Deterministic order helps debugging
  const sortByDesc = (a: SystemTypeInterface, b: SystemTypeInterface) =>
    a.description.localeCompare(b.description);
  roots.sort(sortByDesc);
  for (const arr of buckets.values()) arr.sort(sortByDesc);

  // DFS with cycle guard (prevents infinite recursion if data has loops)
  const visiting = new Set<string>();
  const toNode = (it: SystemTypeInterface): SystemTypeTreeNode => {
    const id = it.modelicaPath;
    if (visiting.has(id)) {
      // Break the cycle: show the node but stop descending.
      return { id, item: it, children: [] };
    }
    visiting.add(id);
    const kids = (buckets.get(id) ?? []).map((child) => toNode(child));
    visiting.delete(id);
    return { id, item: it, children: kids };
  };

  return roots.map(toNode);
}

export default class Template {
  _mods: Modifiers | undefined; // internal cache so we don't recompute... doesn't help
  templates: TemplateInterface[];
  _templates: { [key: string]: TemplateInterface } = {};
  optionList: OptionInterface[];
  _options: { [key: string]: OptionInterface } = {};
  systemTypes: SystemTypeInterface[];
  rootStore: RootStore;

  constructor(rootStore: RootStore, templateData: TemplateDataInterface) {
    this.templates = templateData.templates;
    this.optionList = templateData.options;
    this.systemTypes = templateData.systemTypes;
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

  getSystemTypeForest() {
    return buildSystemTypeForest(this.systemTypes);
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
