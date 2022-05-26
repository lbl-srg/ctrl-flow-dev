import tplData from "../templates/system-template-test-package.json";

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
  templates = tplData.templates;
  options = tplData.options;
  systemTypes = tplData.systemTypes;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  getTemplateByPath(path) {
    return this.templates.find((tpl) => tpl.modelicaPath === path);
  }

  getTemplatesForSystem(path) {
    return this.templates.filter((tpl) => tpl.systemTypes.includes(path));
  }

  getActiveTemplatesForSystem(systemPath) {
    return this.getTemplatesForSystem(systemPath).filter((tpl) =>
      this.rootStore.configStore.hasSystemTemplateConfigs(
        systemPath,
        tpl.modelicaPath,
      ),
    );
  }

  getSystemTypeByPath(path) {
    return this.systemTypes.find(
      (systemType) => systemType.modelicaPath === path,
    );
  }

  get nestedOptions() {
    const allOptions = this.options;

    return this.options.map((option) => {
      if (option.options) {
        option.childOptions = option.options.map((path) => {
          return allOptions.find((opt) => {
            return opt.modelicaPath === path;
          });
        });
      }

      return option;
    });
  }

  getIconForSystem(systemPath) {
    const match = icons.find((item) => item.systemPath === systemPath);
    return match ? match.iconClass : "";
  }

  getOptionsForTemplate(path) {
    const nested = this.nestedOptions;
    const template = this.getTemplateByPath(path);
    return template.options.map((optionPath) =>
      nested.find((opt) => opt.modelicaPath === optionPath),
    );
  }
}
