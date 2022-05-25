import tplData from "../templates/system-template-test-package.json";

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

  getTemplatesForSystem(systemType) {
    return this.templates.filter((tpl) =>
      tpl.systemTypes.includes(systemType.modelicaPath),
    );
  }

  getSystemTypeByPath(path) {
    return this.systemTypes.find(
      (systemType) => systemType.modelicaPath === path,
    );
  }

  getOptionsForTemplate(path) {
    return this.options;
    // return this.template.options
    //   .map((path) =>
    //     this.options.find(({ modelicaPath }) => modelicaPath === path),
    //   )
    //   .filter((option) => option);
  }
}
