/**
 * Store for linkage widget
 */

import create, { SetState, GetState } from "zustand";
import { devtools, persist } from "zustand/middleware";

import getMockData from "./mock-data";
import uiSlice, { uiSliceInterface } from "./slices/ui-slice";
import userSlice, { UserSliceInterface } from "./slices/user-slice";
import { sortByName } from "../utils/utils";
import packageJSON from "../../package.json";

const STORAGE_KEY = "linkage-storage";

export * from "./slices/user-slice";

export interface SystemType {
  id: number;
  name: string;
}

// modelicaPath+name should be the unique identifier for options
export interface OptionN {
  id: number;
  type: string;
  name: string;
  options?: number[];
  group?: string;
  modelicaPath?: string;
  value?: number | boolean;
}

export interface Option extends Omit<OptionN, "options"> {
  options?: Option[];
}

export interface SystemTemplateN {
  id: number;
  systemType: number;
  name: string;
  options?: number[];
}

export interface SystemTemplate
  extends Omit<SystemTemplateN, "systemType" | "options"> {
  systemType: SystemType;
  options?: Option[];
}

export type GetAction<T> = (get: GetState<State>) => T;
export type SetAction<T> = (payload: T, set: SetState<State>) => void;

const _getTemplates: GetAction<SystemTemplate[]> = (get, sort = sortByName) => {
  const templatesN = get().templates;
  const options = _getAllOptions(get);

  const tpls = templatesN.map((t) => ({
    id: t.id,
    systemType: get().systemTypes.find(
      (sType) => sType.id === t.systemType,
    ) as SystemType,
    name: t.name,
    options: t.options
      ? t.options?.map((oID) => options.find((o) => oID === o.id) as Option)
      : [],
  }));

  return sort ? tpls.sort(sort) : tpls;
};

const _getAllOptions: (get: GetState<State>) => Option[] = (get) => {
  // denormalize list in two passes: first create options without child options
  // then populate child options after references have been created
  const optionsN = get().options;
  const options = optionsN.map(
    (o) => ({ ...o, ...{ options: undefined } } as Option),
  );
  options.map((o) => {
    const optionN = optionsN.find((option) => option.id === o.id) as OptionN;
    if (optionN.options) {
      o.options = optionN.options.map(
        (cID) => options.find((option) => cID === option.id) as Option,
      );
    }
  });

  return options;
};

// for a given template, returns two lists: the initial options and all available options
const _getOptions: (
  template: SystemTemplate,
  get: GetState<State>,
) => [Option[], Option[]] = (template, get) => {
  const optionIDs: number[] = [];
  const templateOptionsN: OptionN[] = [];
  const initOptions = template.options || [];

  if (template.options) {
    const options = get().options;
    optionIDs.push(...template.options.map((o) => o.id));

    while (optionIDs.length > 0) {
      const curID = optionIDs.pop();
      const curNode = options.find((o) => o.id === curID) as OptionN;
      if (curNode.options) {
        optionIDs.push(...curNode.options);
      }
      templateOptionsN.push(curNode);
    }
  }

  const options = _getAllOptions(get);
  const templateOptions = templateOptionsN.map(
    (o) => options.find((option) => option.id === o.id) as Option,
  );

  return [initOptions, templateOptions];
};

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);

export interface State extends uiSliceInterface, UserSliceInterface {
  systemTypes: SystemType[];
  templates: SystemTemplateN[];
  options: OptionN[];
  version: string;
  getOptions: () => Option[];
  getTemplates: () => SystemTemplate[];
  getTemplateOptions: (template: SystemTemplate) => [Option[], Option[]];
}

export const useStore = create<State>(
  devtools(
    persist(
      (set, get) => {
        const {
          state: { version = null },
        } = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"state":{}}');

        if (version && version !== packageJSON.version) {
          console.warn(
            `Old schema version ${version} found. Clearing localStorage. Using schema version ${packageJSON.version}`,
          );
          localStorage.clear();
        }

        return {
          version: packageJSON.version,
          ...uiSlice(set, get),
          ...userSlice(set, get),
          systemTypes: getMockData()["systemTypes"],
          templates: getMockData()["templates"],
          options: getMockData()["options"],
          getOptions: () => _getAllOptions(get),
          getTemplates: () => _getTemplates(get),
          getTemplateOptions: (template: SystemTemplate) =>
            _getOptions(template, get),
        };
      },
      {
        name: STORAGE_KEY,
      },
    ),
  ),
);
