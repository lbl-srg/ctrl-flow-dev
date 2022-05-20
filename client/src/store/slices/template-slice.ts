import tplData from "../../templates/system-template-test-package.json";

import { SetState, GetState } from "zustand";
import { State } from "../store";

export interface StTemplate {
  modelicaPath: string;
  systemTypes: string[];
  name: string;
  options: string[];
}
// copied over from server...
export interface StTemplateOption {
  type: string;
  name: string;
  modelicaPath: string;
  options?: string[];
  group?: string;
  tab?: string;
  value?: any;
  valueExpression?: any;
  enable?: any;
  childOptions?: StTemplateOption[];
}

export interface StSystemType {
  description: string;
  modelicaPath: string;
}

export interface TemplateSliceInterface {
  templates: StTemplate[];
  systemTypes: StSystemType[];
  getTemplateOptions: (template: StTemplate) => StTemplateOption[];
  getNestedOptions: () => StTemplateOption[];
}

const templates = tplData.templates as StTemplate[];
const options = tplData.options as StTemplateOption[];
const systemTypes = tplData.systemTypes as StSystemType[];

export default function (
  set: SetState<State>,
  get: GetState<State>,
): TemplateSliceInterface {
  return {
    systemTypes,
    templates,

    getNestedOptions: () => {
      function findOptions(option: StTemplateOption): StTemplateOption {
        if (option.options) {
          option.childOptions = option.options
            .map((path) => options.find((opt) => opt.modelicaPath === path))
            .filter((opt) => opt) as StTemplateOption[];
        }

        return option;
      }

      return options.map(findOptions);
    },

    getTemplateOptions: (template: StTemplate): StTemplateOption[] => {
      const options = get().options;

      return template.options
        .map((path) =>
          options.find(({ modelicaPath }) => modelicaPath === path),
        )
        .filter((option) => option) as StTemplateOption[];
    },
  };
}
