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

  getSystemTypeByPath(path) {
    return this.systemTypes.find(
      (systemType) => systemType.modelicaPath === path,
    );
  }

  get nestedOptions() {
    function findOptions(option) {
      if (option.options) {
        option.childOptions = option.options
          .map((path) => this.options.find((opt) => opt.modelicaPath === path))
          .filter((opt) => opt);
      }

      return option;
    }

    return this.options.map(findOptions);
  }

  getIconForSystem(systemPath) {
    const match = icons.find((item) => item.systemPath === systemPath);
    return match ? match.iconClass : "";
  }

  getOptionsForTemplate(path) {
    // TODO: return the options for the template, might need the whole thing here instead of the path
    return this.options;
    // return this.template.options
    //   .map((path) =>
    //     this.options.find(({ modelicaPath }) => modelicaPath === path),
    //   )
    //   .filter((option) => option);
  }
}
