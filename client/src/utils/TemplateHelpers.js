import tplData from "../templates/system-template-test-package.json";

// this data is not reactive, so no reason to put in the store, or localStorage

function getNestedOptions() {
  function findOptions(option) {
    if (option.options) {
      option.childOptions = option.options
        .map((path) => options.find((opt) => opt.modelicaPath === path))
        .filter((opt) => opt);
    }

    return option;
  }

  return options.map(findOptions);
}

export const options = tplData.options;
export const templates = tplData.templates;
export const systemTypes = tplData.systemTypes;
export const nestedOptions = getNestedOptions();

export function getTemplatesForSystem(systemType) {
  return templates.filter((tpl) =>
    tpl.systemTypes.includes(systemType.modelicaPath),
  );
}

export function getTemplateByPath(path) {
  return templates.find((tpl) => tpl.modelicaPath === path);
}

export function getSystemTypeByPath(path) {
  return systemTypes.find((systemType) => systemType.modelicaPath === path);
}

export function getOptionsForTemplate(template) {
  return template.options
    .map((path) => options.find(({ modelicaPath }) => modelicaPath === path))
    .filter((option) => option);
}
