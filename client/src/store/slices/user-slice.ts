import { SetState, GetState } from "zustand";
import { State, Option, SystemTemplate, GetAction, SetAction } from "../store";
import { produce } from "immer";

import { deduplicate } from "../../utils/utils";

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

export interface UserSystemN {
  id: number;
  tag: string;
  prefix: string;
  number: number;
  config: number;
  data: any[]; // TODO: how we get the types for the rest of the table data is still being defined
}

export interface UserSystem extends Omit<UserSystemN, "config"> {
  config: Configuration;
}

export interface MetaConfiguration {
  tagPrefix: string;
  tagStartIndex: number;
  quantity: number;
  config: Configuration; // configuration ID
  systems: UserSystem[];
}

export interface UserProjectN {
  configs: number[];
  userSystems: number[];
  projectDetails: Partial<ProjectDetails>;
  id: number;
}

export interface UserProject
  extends Omit<UserProjectN, "configs" | "userSystems" | "appliedConfigs"> {
  configs: Configuration[];
  userSystems: UserSystem[];
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

export interface UserSystemN {
  id: number;
  tag: string;
  config: number;
  data: any[]; // placeholder for whatever else will populate schedule table
}

export interface UserSystem extends Omit<UserSystemN, "config"> {
  config: Configuration;
}

const _saveProjectDetails: SetAction<Partial<ProjectDetails>> = (
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
    userSystems: get().getUserSystems(),
    projectDetails: activeProjectN.projectDetails,
  };
};

const _getActiveTemplates: GetAction<SystemTemplate[]> = (get) => {
  const configs = get().getConfigs();

  return deduplicate(configs.map((c) => c.template));
};

/**
 * Maps ConfigurationN to denormalized Configuration
 */
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

const _getUserSystems: (
  template: SystemTemplate | undefined,
  get: GetState<State>,
) => UserSystem[] = (template, get) => {
  const configs = get().getConfigs();
  const systems = get().userSystems;
  const userProject = get().userProjects.find(
    (proj) => proj.id === get().activeProject,
  ) as UserProjectN;
  const projectSystems = systems.filter(
    (system) => userProject.userSystems.indexOf(system.id) >= 0,
  );

  const filteredSystems = template
    ? projectSystems.filter((system) => {
        const config = configs.find((c) => c.id === system.config);
        return config?.template.id === template.id;
      })
    : projectSystems;

  return filteredSystems.map((system) => ({
    id: system.id,
    tag: system.tag,
    prefix: system.prefix,
    number: system.number,
    config: configs.find((c) => c.id === system.config) as Configuration,
    data: system.data,
  }));
};

const _addUserSystems = (
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
        const newSystems: UserSystemN[] = [];

        for (let i = 0; i < quantity; i += 1) {
          const system: UserSystemN = {
            id: getID(),
            tag: `${prefix} - ${start + i}`,
            prefix: prefix,
            number: start + i,
            config: config.id,
            data: [],
          };
          newSystems.push(system);
        }

        state.userSystems.push(...newSystems);
        activeProject.userSystems.push(...newSystems.map((s) => s.id));
      }
    }),
  );
};

const _removeUserSystem = (system: UserSystem, set: SetState<State>) => {
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(
        (proj) => proj.id === state.activeProject,
      );
      if (activeProject) {
        activeProject.userSystems = activeProject.userSystems.filter(
          (sID) => sID !== system.id,
        );
      }
      state.userSystems = state.userSystems.filter((s) => s.id !== system.id);
    }),
  );
};

const _getMetaConfigs = (get: GetState<State>) => {
  const sortedSystems: { [key: string]: UserSystem[] } = {};
  const systems = get().getUserSystems();

  systems.map((s) => {
    const key = `${s.config.id}${s.prefix}`;
    const metaConfigList = sortedSystems[key] || [];
    sortedSystems[key] = [...metaConfigList, s];
  });

  const metaConfigList: MetaConfiguration[] = [];

  Object.entries(sortedSystems).map(([key, systemList]) => {
    const [system, ...rest] = systemList;
    const start = Math.min(...systemList.map((s) => s.number));
    const sortedList = systemList.sort((s1, s2) => s1.number - s2.number);
    const configs = get().getConfigs();

    const metaConfig: MetaConfiguration = {
      tagPrefix: system.prefix,
      tagStartIndex: start,
      quantity: sortedList.length,
      config: system.config,
      systems: sortedList,
    };

    metaConfigList.push(metaConfig);
  });

  return metaConfigList;
};

// TODO... get a better uid system
let _idIncrement = 0;
const getID = () => (_idIncrement += 1);

const initialUserProject: UserProjectN = {
  configs: [],
  userSystems: [],
  projectDetails: {},
  id: getID(),
};

export interface UserSliceInterface {
  saveProjectDetails: (projectDetails: Partial<ProjectDetails>) => void;
  configurations: ConfigurationN[];
  userProjects: UserProjectN[];
  userSystems: UserSystemN[];
  activeProject: number;
  getActiveTemplates: () => SystemTemplate[];
  getActiveProject: () => UserProject;
  setActiveProject: SetAction<UserProject>;
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
  removeConfig: (config: Configuration) => void;
  removeAllTemplateConfigs: (template: SystemTemplate) => void;
  getMetaConfigs: () => MetaConfiguration[];
  getUserSystems: (template?: SystemTemplate) => UserSystem[];
  addUserSystems: (
    prefix: string,
    start: number,
    quantity: number,
    config: Configuration,
  ) => void;
  removeUserSystem: (system: UserSystem) => void;
}

export default function (
  set: SetState<State>,
  get: GetState<State>,
): UserSliceInterface {
  return {
    activeProject: 1,
    userProjects: [initialUserProject],
    userSystems: [],
    configurations: [],
    saveProjectDetails: (projectDetails) =>
      _saveProjectDetails(projectDetails, get, set),
    getActiveProject: () => _getActiveProject(get),
    setActiveProject: (userProject: UserProject) =>
      set({ activeProject: userProject.id }),
    getActiveTemplates: () => _getActiveTemplates(get),
    getConfigs: () => _getConfigs(get),
    addConfig: (template: SystemTemplate, attrs = {}) =>
      _addConfig(template, attrs, set),
    updateConfig: (
      config: Configuration,
      configName: string,
      selections: Selection[],
    ) => _updateConfig(config, configName, selections, set),
    removeConfig: (config: Configuration) => _removeConfig(config, get, set),
    removeAllTemplateConfigs: (template: SystemTemplate) =>
      _removeAllTemplateConfigs(template, get, set),
    addUserSystems: (
      prefix: string,
      start: number,
      quantity: number,
      config: Configuration,
    ) => _addUserSystems(prefix, start, quantity, config, set),
    getUserSystems: (template = undefined) => _getUserSystems(template, get),
    removeUserSystem: (userSystem: UserSystem) =>
      _removeUserSystem(userSystem, set),
    getMetaConfigs: () => _getMetaConfigs(get),
  };
}
