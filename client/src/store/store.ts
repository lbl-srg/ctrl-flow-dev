import create, { SetState, GetState } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

import getMockData from "./mock-data";

import uiSlice, { uiSliceInterface } from "./slices/ui-slice";

// TODO... get a better uid system
let _idIncrement = 0;
const getID = () => (_idIncrement += 1);

export interface ProjectDetails {
  name: string;
  address: string;
  type: "multi-story office" | "warehouse" | "something else";
  size: number;
  units: "ip" | "something";
  code: "ashrae 90.1 20201" | "a different one";
  notes: string;
  id: number;
}

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

export type SelectionN = {
  parent: number;
  option: number;
  value?: number | boolean | string;
};

export interface Selection extends Omit<SelectionN, "parent" | "option"> {
  parent: Option;
  option: Option; // TODO: remove this 'option' key and add 'Option' as a possible type for value
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

export interface ConfigurationN {
  id: number;
  template: number; // ID of SystemTemplate
  name: string | undefined;
  selections: SelectionN[];
}

export interface Configuration
  extends Omit<ConfigurationN, "template" | "selections"> {
  template: SystemTemplate;
  selections: Selection[];
}

export interface AppliedConfigurationN {
  id: number;
  tag: string;
  config: number;
  data: any[]; // TODO: how we get the types for the rest of the table data is still being defined
}

export interface AppliedConfiguration
  extends Omit<AppliedConfigurationN, "config"> {
  config: Configuration;
}

export interface MetaConfigurationN {
  id: number;
  tagPrefix: string;
  tagStartIndex: number;
  quantity: number;
  config: number; // configuration ID
}

export interface MetaConfiguration extends Omit<MetaConfigurationN, "config"> {
  config: Configuration;
}

export interface UserProjectN {
  configs: number[];
  metaConfigs: number[];
  appliedConfigs: number[];
  projectDetails: Partial<ProjectDetails>;
  id: number;
}

export interface UserProject
  extends Omit<UserProjectN, "configs" | "metaConfigs" | "appliedConfigs"> {
  configs: Configuration[];
  metaConfigs: MetaConfiguration[];
  appliedConfigs: AppliedConfiguration[];
}

type GetAction<T> = (get: GetState<State>) => T;
type SetAction<T> = (
  payload: T,
  get: GetState<State>,
  set: SetState<State>,
) => void;

const initialUserProject: UserProjectN = {
  configs: [],
  metaConfigs: [],
  appliedConfigs: [],
  projectDetails: {},
  id: getID(),
};

/**
 * Returns a denormalized user project
 */
const _getActiveProject: GetAction<UserProject> = (get) => {
  const activeProjectN = get().userProjects.find(
    (uProject) => uProject.id === get().activeProject,
  ) as UserProjectN;
  const activeProject = {};

  return {
    id: activeProjectN.id,
    configs: get().getConfigs(),
    metaConfigs: get().getMetaConfigs(),
    appliedConfigs: [],
    projectDetails: activeProjectN.projectDetails,
  };
};

const _getTemplates: GetAction<SystemTemplate[]> = (get) => {
  const templatesN = get().templates;
  const options = _getAllOptions(get);

  return templatesN.map((t) => ({
    id: t.id,
    systemType: get().systemTypes.find(
      (sType) => sType.id === t.systemType,
    ) as SystemType,
    name: t.name,
    options: t.options
      ? t.options?.map((oID) => options.find((o) => oID === o.id) as Option)
      : [],
  }));
};

const _getActiveTemplates: GetAction<SystemTemplate[]> = (get) => {
  const configs = get().getConfigs();
  const activeTemplateSet = new Set(configs.map((c) => c.template));
  return Array.from(activeTemplateSet.values());
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

const _getConfigs: GetAction<Configuration[]> = (get) => {
  const configs = get().configurations;
  const activeProject = get().userProjects.find(
    (proj) => proj.id === get().activeProject,
  ) as UserProjectN;
  const projectConfigs = configs.filter(
    (c) => activeProject.configs.indexOf(c.id) >= 0,
  );

  return _getConfigsHelper(projectConfigs, get);
};

const _getConfigsHelper: (
  configs: ConfigurationN[],
  get: GetState<State>,
) => Configuration[] = (configs, get) => {
  const templates = get().getTemplates();
  const options = get().getOptions();
  return configs.map((config) => ({
    id: config.id,
    template: templates.find((t) => t.id === config.template) as SystemTemplate,
    name: config.name,
    selections: config.selections.map((s) => ({
      parent: options.find((o) => o.id === s.parent) as Option,
      option: options.find((o) => o.id === s.option) as Option,
      value: s.value,
    })),
  }));
};

const _getMetaConfigs: (
  template: SystemTemplate | undefined,
  get: GetState<State>,
) => MetaConfiguration[] = (template, get) => {
  const configs = get().getConfigs();
  const metaConfigs = get().metaConfigurations;
  const userProject = get().userProjects.find(
    (proj) => proj.id === get().activeProject,
  ) as UserProjectN;
  const projectMetaConfigs = metaConfigs.filter(
    (mConfig) => userProject.metaConfigs.indexOf(mConfig.id) >= 0,
  );

  const filteredMetaConfigs = template
    ? projectMetaConfigs.filter((mConf) => {
        const config = configs.find((c) => c.id === mConf.config);
        return config?.template.id === template.id;
      })
    : metaConfigs;

  return filteredMetaConfigs.map((mConf) => ({
    id: mConf.id,
    tagPrefix: mConf.tagPrefix,
    tagStartIndex: mConf.tagStartIndex,
    quantity: mConf.quantity,
    config: configs.find((c) => c.id === mConf.config) as Configuration,
  }));
};

const _addMetaConfig = (
  prefix: string,
  start: number,
  quantity: number,
  config: Configuration,
  set: SetState<State>,
) => {
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(
        (proj) => proj.id === state.activeProject,
      );
      if (activeProject) {
        const metaConfig: MetaConfigurationN = {
          id: getID(),
          tagPrefix: prefix,
          tagStartIndex: start,
          config: config.id,
          quantity: quantity,
        };

        state.metaConfigurations.push(metaConfig);
        activeProject.metaConfigs.push(metaConfig.id);
      }
    }),
  );
};

const saveProjectDetails: SetAction<Partial<ProjectDetails>> = (
  projectDetails,
  get,
  set,
) =>
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(
        (project) => project.id === state.activeProject,
      );
      if (activeProject) {
        activeProject.projectDetails = {
          ...activeProject?.projectDetails,
          ...projectDetails,
        };
      }
    }),
  );

const _addConfig = (
  template: SystemTemplate,
  attrs: Partial<ConfigurationN>,
  set: SetState<State>,
) => {
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(
        (proj) => proj.id === state.activeProject,
      );
      if (activeProject) {
        const configDefaults = {
          id: getID(),
          template: template.id,
          name: "",
          selections: [],
        };
        const config = { ...configDefaults, ...attrs };
        state.configurations.push(config);
        activeProject.configs.push(config.id);
      }
    }),
  );
};

/**
 * Helper method that given a set of new selections, makes sure no-longer relevant child
 * selections are removed from the provided config, then combines that filtered list
 * of previous selections with the new ones
 */
const getFilteredSelectionList = (
  state: State,
  selections: Selection[],
  newSelections: Selection[],
) => {
  const nodeList = newSelections.map((s) => s.parent);
  const filterList: number[] = [];

  while (nodeList.length > 0) {
    const parentOption = nodeList.pop() as Option;
    if (parentOption) {
      const children = parentOption.options;
      if (children) {
        nodeList.push(...children);
      }
      filterList.push(parentOption.id);
    }
  }

  const previousSelections = selections
    ? selections.filter((s) => !filterList.includes(s.parent.id))
    : [];

  // combine the filtered list of old selections + the new selections
  return [...previousSelections, ...newSelections];
};

const _updateConfig = (
  config: Configuration,
  configName: string,
  selections: Selection[],
  set: SetState<State>,
) =>
  set(
    produce((state: State) => {
      const conf = state.configurations.find(
        (c) => c.id === config.id,
      ) as ConfigurationN;

      conf.name = configName;
      const updatedSelections = getFilteredSelectionList(
        state,
        config.selections,
        selections,
      );
      // convert to normalized format
      conf.selections = updatedSelections.map((s) => ({
        parent: s.parent.id,
        option: s.option.id,
        value: s.value,
      }));
    }),
  );

const _removeConfig: SetAction<Configuration> = (config, get, set) => {
  set(
    produce((state: State) => {
      const configs = get().getActiveProject().configs;
      const activeProject = state.userProjects.find(
        (proj) => proj.id === state.activeProject,
      );

      if (activeProject) {
        activeProject.configs = activeProject.configs.filter(
          (cID) => cID !== config.id,
        );
      }

      state.configurations = state.configurations.filter(
        (c) => c.id !== config.id,
      );
    }),
  );
};

const _removeAllTemplateConfigs: SetAction<SystemTemplate> = (
  template,
  get,
  set,
) => {
  set(
    produce((state: State) => {
      const configs = state.configurations;
      const activeProject = get().getActiveProject();
      const configsToRemove = activeProject.configs
        .map(
          (config) => configs.find((c) => c.id === config.id) as ConfigurationN,
        )
        .filter((c) => c.template === template.id)
        .map((c) => c.id);

      activeProject.configs = activeProject.configs.filter(
        (c) => !configsToRemove.includes(c.id),
      );
      state.configurations = configs.filter(
        (c) => !configsToRemove.includes(c.id),
      );
    }),
  );
};

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);

export interface State extends uiSliceInterface {
  saveProjectDetails: (projectDetails: Partial<ProjectDetails>) => void;
  systemTypes: SystemType[];
  templates: SystemTemplateN[];
  options: OptionN[];
  configurations: ConfigurationN[];
  metaConfigurations: MetaConfigurationN[];
  userProjects: UserProjectN[];
  activeProject: number;
  getActiveProject: () => UserProject;
  setActiveProject: SetAction<UserProject>;
  getOptions: () => Option[];
  getTemplates: () => SystemTemplate[];
  getTemplateOptions: (template: SystemTemplate) => [Option[], Option[]];
  getActiveTemplates: () => SystemTemplate[];
  getConfigs: () => Configuration[];
  addConfig: (
    template: SystemTemplate,
    attrs?: Partial<ConfigurationN>,
  ) => void; // TODO: on template add, default config must be added
  updateConfig: (
    config: Configuration,
    configName: string,
    selections: Selection[],
  ) => void;
  getMetaConfigs: (template?: SystemTemplate) => MetaConfiguration[];
  addMetaConfig: (
    prefix: string,
    start: number,
    quantity: number,
    config: Configuration,
  ) => void;
  removeConfig: (config: Configuration) => void;
  removeAllTemplateConfigs: (template: SystemTemplate) => void;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      ...uiSlice(set, get),
      saveProjectDetails: (projectDetails) =>
        saveProjectDetails(projectDetails, get, set),
      systemTypes: getMockData()["systemTypes"],
      templates: getMockData()["templates"],
      options: getMockData()["options"],
      configurations: [],
      metaConfigurations: [],
      userProjects: [initialUserProject],
      activeProject: 1,
      getActiveProject: () => _getActiveProject(get),
      setActiveProject: (userProject: UserProject) =>
        set({ activeProject: userProject.id }),
      getOptions: () => _getAllOptions(get),
      getTemplates: () => _getTemplates(get),
      getTemplateOptions: (template: SystemTemplate) =>
        _getOptions(template, get),
      getActiveTemplates: () => _getActiveTemplates(get),
      addConfig: (template: SystemTemplate, attrs = {}) =>
        _addConfig(template, attrs, set),
      getConfigs: () => _getConfigs(get),
      addMetaConfig: (
        prefix: string,
        start: number,
        quantity: number,
        config: Configuration,
      ) => _addMetaConfig(prefix, start, quantity, config, set),
      getMetaConfigs: (template = undefined) => _getMetaConfigs(template, get),
      updateConfig: (
        config: Configuration,
        configName: string,
        selections: Selection[],
      ) => _updateConfig(config, configName, selections, set),
      removeConfig: (config: Configuration) => _removeConfig(config, get, set),
      removeAllTemplateConfigs: (template: SystemTemplate) =>
        _removeAllTemplateConfigs(template, get, set),
    }),
    {
      name: "linkage-storage",
    },
  ),
);
