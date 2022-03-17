/**
 * Store slice containing actions and storage for user generated data
 *
 * TODO: clean up use of the zustand 'get()' and immer 'state'. Anytime there is a state update,
 * the 'state' object must be used to find what is being updated and not the zustand 'get()'
 *
 * Zustand freezes (makes read only) items returned from a 'get()' and does not allow updates
 */

import { SetState, GetState } from "zustand";
import {
  State,
  Option,
  SystemTemplate,
  GetAction,
  SetAction,
  CompareFunction,
} from "../store";
import { produce } from "immer";

import {
  trace,
  deduplicate,
  sortByName,
  SortableByName,
} from "../../utils/utils";

import getMockData from "../mock-data";

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

export interface ScheduleGroup {
  group: string;
  children: { name: string; value: string }[];
}

export interface UserSystemN {
  id: number;
  tag: string;
  prefix: string;
  number: number;
  config: number;
  scheduleList: ScheduleGroup[];
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
  name: string;
  isLocked: boolean;
  selections: SelectionN[];
}

export interface Configuration
  extends Omit<ConfigurationN, "template" | "selections"> {
  template: SystemTemplate;
  selections: Selection[];
}

const _saveProjectDetails: SetAction<Partial<ProjectDetails>> = (
  projectDetails,
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

const _getActiveProjectN: (state: State) => UserProjectN = (state) => {
  return state.userProjects.find(
    (proj) => proj.id === state.activeProject,
  ) as UserProjectN;
};

/**
 * Returns a denormalized user project
 */
const _getActiveProject: GetAction<UserProject> = (get) => {
  const activeProjectN = _getActiveProjectN(get());
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
    ...config,
    template: templates.find((t) => t.id === config.template) as SystemTemplate,

    selections: config.selections.map((s) => ({
      parent: options.find((o) => o.id === s.parent) as Option,
      option: options.find((o) => o.id === s.option) as Option,
      value: s.value,
    })),
  }));
};

const _getConfigs: (
  template: SystemTemplate | undefined,
  get: GetState<State>,
) => Configuration[] = (template, get) => {
  const allConfigs = get().configurations;
  const activeProject = _getActiveProjectN(get());
  // get only active project configs, if a template has been provided
  // just return configs that match that template
  const configs = allConfigs
    .filter(({ id }) => activeProject.configs.includes(id))
    .filter((c) => (template ? c.template === template.id : true));

  return _getConfigsHelper(configs, get);
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
          isLocked: false,
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

const _removeConfig = (
  config: Configuration | ConfigurationN,
  set: SetState<State>,
) => {
  set(
    produce((state: State) => {
      const activeProject = _getActiveProjectN(state);
      activeProject.configs = activeProject.configs.filter(
        (cID) => cID !== config.id,
      );
      const configsToRemove = state.configurations
        .filter((c) => c.id === config.id)
        .map((c) => c.id);
      state.configurations = state.configurations.filter(
        (c) => !configsToRemove.includes(c.id),
      );

      const systemsToRemove = state.userSystems
        .filter((s) => configsToRemove.includes(s.config))
        .map((s) => s.id);

      activeProject.userSystems = activeProject.userSystems.filter(
        (sID) => !systemsToRemove.includes(sID),
      );

      state.userSystems = state.userSystems.filter(
        (s) => !systemsToRemove.includes(s.id),
      );
    }),
  );
};

const _removeAllTemplateConfigs: SetAction<SystemTemplate> = (
  template,
  set,
) => {
  set(
    produce((state: State) => {
      const configs = state.configurations;
      const activeProject = _getActiveProjectN(state);

      // remove all dependent entities (configs, user systems)
      // TODO: logic for how to remove these things should be in
      // on place however there is a problem around nested state update calls
      const configsToRemove = activeProject.configs
        .map((cID) => configs.find((c) => c.id === cID) as ConfigurationN)
        .filter((c) => c.template === template.id)
        .map((c) => c.id);

      const systemsToRemove = state.userSystems
        .filter((s) => configsToRemove.includes(s.config))
        .map((s) => s.id);

      state.userSystems = state.userSystems.filter(
        (s) => !systemsToRemove.includes(s.id),
      );

      activeProject.userSystems = activeProject.userSystems.filter(
        (sID) => !systemsToRemove.includes(sID),
      );

      activeProject.configs = activeProject.configs.filter(
        (cID) => !configsToRemove.includes(cID),
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
    scheduleList: system.scheduleList,
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
      const activeProject = _getActiveProjectN(state);
      if (activeProject) {
        const newSystems: UserSystemN[] = [];

        for (let i = 0; i < quantity; i += 1) {
          const system: UserSystemN = {
            id: getID(),
            tag: `${prefix} - ${start + i}`,
            prefix: prefix,
            number: start + i,
            config: config.id,
            scheduleList: getMockData()["scheduleList"],
          };
          newSystems.push(system);
        }

        state.userSystems.push(...newSystems);
        activeProject.userSystems.push(...newSystems.map((s) => s.id));
      }
    }),
  );
};

const _updateUserSystem = (
  system: UserSystem,
  tag: string,
  config: Configuration,
  scheduleList: ScheduleGroup[],
  set: SetState<State>,
) => {
  set(
    produce((state: State) => {
      const userSystem = state.userSystems.find((s) => s.id === system.id);
      if (userSystem) {
        userSystem.config = config.id;
        userSystem.scheduleList = scheduleList;
        userSystem.tag = tag;
      }
    }),
  );
};

const _removeUserSystem = (
  system: UserSystem | UserSystemN,
  set: SetState<State>,
) => {
  set(
    produce((state: State) => {
      const activeProject = _getActiveProjectN(state);

      activeProject.userSystems = activeProject.userSystems.filter(
        (sID) => sID !== system.id,
      );

      state.userSystems = state.userSystems.filter((s) => s.id !== system.id);
    }),
  );
};

// calculates 'MetaConfiguration' values based on current user systems
// in the active project
const _getMetaConfigs = (
  template: SystemTemplate | undefined,
  get: GetState<State>,
) => {
  const systemMap: { [key: string]: { systems: UserSystem[]; order: number } } =
    {};
  const systems = get().getUserSystems();

  const filteredSystems = template
    ? systems.filter((system) => system.config?.template.id === template.id)
    : systems;

  // Order is tracked to make sure metaconfigs are output in the declarative
  // order of the user systems
  let order = 0;

  filteredSystems.map((s) => {
    const key = `${s.config.id}`;
    const entry = systemMap[key];
    if (entry) {
      entry.systems = [...entry.systems, s];
    } else {
      systemMap[key] = { systems: [s], order: order };
      order += 1;
    }
  });

  const metaConfigList: MetaConfiguration[] = [];

  Object.entries(systemMap).map(([key, systemEntry]) => {
    const [system, ...rest] = systemEntry.systems;
    const start = Math.min(...systemEntry.systems.map((s) => s.number));
    const sortedList = systemEntry.systems.sort(
      (s1, s2) => s1.number - s2.number,
    );

    const metaConfig: MetaConfiguration = {
      tagPrefix: system.prefix,
      tagStartIndex: start,
      quantity: sortedList.length,
      config: system.config,
      systems: sortedList,
    };

    metaConfigList[systemEntry.order] = metaConfig;
  });

  return metaConfigList;
};

// TODO... get a better uid system
let _incriment = 0;
function getID(): number {
  _incriment++;
  return Math.floor(Math.random() * 1000000000 + _incriment);
}
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
  getActiveTemplates: (
    sort?: CompareFunction<SortableByName> | null | undefined,
  ) => SystemTemplate[];
  getActiveProject: () => UserProject;
  setActiveProject: SetAction<UserProject>;
  getConfigs: (
    template?: SystemTemplate,
    sort?: CompareFunction<SortableByName> | null | undefined,
  ) => Configuration[];
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
  toggleConfigLock: (configId: number) => void;
  removeAllTemplateConfigs: (template: SystemTemplate) => void;
  getUserSystems: (
    template?: SystemTemplate,
    sort?: CompareFunction<UserSystem> | null | undefined,
  ) => UserSystem[];
  addUserSystems: (
    prefix: string,
    start: number,
    quantity: number,
    config: Configuration,
  ) => void;
  updateUserSystem: (
    system: UserSystem,
    tag: string,
    config: Configuration,
    scheduleList: ScheduleGroup[],
  ) => void;
  removeUserSystem: (system: UserSystem | UserSystemN) => void;
  getMetaConfigs: (
    template?: SystemTemplate,
    sort?: CompareFunction<MetaConfiguration> | null | undefined,
  ) => MetaConfiguration[];
}

export default function (
  set: SetState<State>,
  get: GetState<State>,
): UserSliceInterface {
  return {
    activeProject: initialUserProject.id,
    userProjects: [initialUserProject],
    userSystems: [],
    configurations: [],
    saveProjectDetails: (projectDetails) =>
      _saveProjectDetails(projectDetails, set),
    getActiveProject: () => _getActiveProject(get),
    setActiveProject: (userProject: UserProject) =>
      set({ activeProject: userProject.id }),
    getActiveTemplates: (sort = sortByName) =>
      sort ? _getActiveTemplates(get).sort(sort) : _getActiveTemplates(get),
    getConfigs: (template = undefined, sort = sortByName) =>
      sort ? _getConfigs(template, get).sort(sort) : _getConfigs(template, get),
    addConfig: (template: SystemTemplate, attrs = {}) =>
      _addConfig(template, attrs, set),
    updateConfig: (
      config: Configuration,
      configName: string,
      selections: Selection[],
    ) => _updateConfig(config, configName, selections, set),
    removeConfig: (config: Configuration) => _removeConfig(config, set),
    toggleConfigLock: (configId) => {
      set(
        produce((state: State) => {
          const config = state.configurations.find(({ id }) => id === configId);
          if (config) config.isLocked = !config.isLocked;
        }),
      );
    },
    removeAllTemplateConfigs: (template: SystemTemplate) =>
      _removeAllTemplateConfigs(template, set),
    addUserSystems: (
      prefix: string,
      start: number,
      quantity: number,
      config: Configuration,
    ) => _addUserSystems(prefix, start, quantity, config, set),
    getUserSystems: (template = undefined, sort?) =>
      _getUserSystems(template, get),
    updateUserSystem: (system, tag, config, scheduleList) =>
      _updateUserSystem(system, tag, config, scheduleList, set),
    removeUserSystem: (userSystem: UserSystem | UserSystemN) =>
      _removeUserSystem(userSystem, set),
    getMetaConfigs: (
      template = undefined,
      sort = (m1: MetaConfiguration, m2: MetaConfiguration) =>
        m1.config.name.localeCompare(m2.config.name),
    ) =>
      sort
        ? _getMetaConfigs(template, get).sort(sort)
        : _getMetaConfigs(template, get),
  };
}
