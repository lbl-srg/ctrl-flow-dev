import tplData from "../../templates/system-template-test-package.json";

const { options, templates, systemTypes } = tplData;

export default function (set, get) {
  return {
    systemTypes,
    templates,

    getTemplates() {
      return templates;
    },

    getOptions() {
      return options;
    },

    getTemplatesForSystem(systemType) {
      return templates.filter((tpl) =>
        tpl.systemTypes.includes(systemType.modelicaPath),
      );
    },

    getNestedOptions: () => {
      function findOptions(option) {
        if (option.options) {
          option.childOptions = option.options
            .map((path) => options.find((opt) => opt.modelicaPath === path))
            .filter((opt) => opt);
        }

        return option;
      }

      return options.map(findOptions);
    },

    getTemplateOptions: (template) => {
      const options = get().options;

      return template.options
        .map((path) =>
          options.find(({ modelicaPath }) => modelicaPath === path),
        )
        .filter((option) => option);
    },
  };
}
