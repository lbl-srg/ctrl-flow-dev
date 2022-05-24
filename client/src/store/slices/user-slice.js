/**
 * Store slice containing actions and storage for user generated data
 *
 * TODO: clean up use of the zustand 'get()' and immer 'state'. Anytime there is a state update,
 * the 'state' object must be used to find what is being updated and not the zustand 'get()'
 *
 * Zustand freezes (makes read only) items returned from a 'get()' and does not allow updates
 */

import { produce } from "immer";
import { deduplicate, sortByName } from "../../utils/utils";
import getMockData from "../mock-data";

const _saveProjectDetails = (projectDetails, set) =>
  set(
    produce((state) => {
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

const _getActiveProjectN = (state) => {
  return state.userProjects.find((proj) => proj.id === state.activeProject);
};

/**
 * Returns a denormalized user project
 */
const _getActiveProject = (get) => {
  const activeProjectN = _getActiveProjectN(get());
  const activeProject = {};

  return {
    id: activeProjectN.id,
    configs: get().getConfigs(),
    userSystems: get().getUserSystems(),
    projectDetails: activeProjectN.projectDetails,
  };
};

const _getActiveTemplates = (get) => {
  const configs = get().getConfigs();

  return deduplicate(configs.map((c) => c.template));
};

/**
 * Maps ConfigurationN to denormalized Configuration
 */
const _getConfigsHelper = (configs, get) => {
  const templates = get().getTemplates();
  const options = get().getOptions();
  return configs.map((config) => ({
    ...config,
    template: templates.find((t) => t.id === config.template),

    selections: config.selections.map((s) => ({
      parent: options.find((o) => o.id === s.parent),
      option: options.find((o) => o.id === s.option),
      value: s.value,
    })),
  }));
};

const _getConfigs = (template, get) => {
  const allConfigs = get().configurations;
  const activeProject = _getActiveProjectN(get());
  // get only active project configs, if a template has been provided
  // just return configs that match that template
  const configs = allConfigs
    .filter(({ id }) => activeProject.configs.includes(id))
    .filter((c) => (template ? c.template === template.id : true));

  return _getConfigsHelper(configs, get);
};

const _addConfig = (template, attrs, set) => {
  set(
    produce((state) => {
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
const getFilteredSelectionList = (state, selections, newSelections) => {
  const nodeList = newSelections.map((s) => s.parent);
  const filterList = [];

  while (nodeList.length > 0) {
    const parentOption = nodeList.pop();
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

const _updateConfig = (config, configName, selections, set) =>
  set(
    produce((state) => {
      const conf = state.configurations.find((c) => c.id === config.id);

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

const _removeConfig = (config, set) => {
  set(
    produce((state) => {
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

const _removeAllTemplateConfigs = (template, set) => {
  set(
    produce((state) => {
      const configs = state.configurations;
      const activeProject = _getActiveProjectN(state);

      // remove all dependent entities (configs, user systems)
      // TODO: logic for how to remove these things should be in
      // on place however there is a problem around nested state update calls
      const configsToRemove = activeProject.configs
        .map((cID) => configs.find((c) => c.id === cID))
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

const _getUserSystems = (template, get) => {
  const configs = get().getConfigs();
  const systems = get().userSystems;
  const userProject = get().userProjects.find(
    (proj) => proj.id === get().activeProject,
  );
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
    config: configs.find((c) => c.id === system.config),
    scheduleList: system.scheduleList,
  }));
};

const _addUserSystems = (prefix, start, quantity, config, set) => {
  set(
    produce((state) => {
      const activeProject = _getActiveProjectN(state);
      if (activeProject) {
        const newSystems = [];

        for (let i = 0; i < quantity; i += 1) {
          const system = {
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

const _updateUserSystem = (system, tag, config, scheduleList, set) => {
  set(
    produce((state) => {
      const userSystem = state.userSystems.find((s) => s.id === system.id);
      if (userSystem) {
        userSystem.config = config.id;
        userSystem.scheduleList = scheduleList;
        userSystem.tag = tag;
      }
    }),
  );
};

const _removeUserSystem = (system, set) => {
  set(
    produce((state) => {
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
const _getMetaConfigs = (template, get) => {
  const systemMap = {};
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

  const metaConfigList = [];

  Object.entries(systemMap).map(([key, systemEntry]) => {
    const [system, ...rest] = systemEntry.systems;
    const start = Math.min(...systemEntry.systems.map((s) => s.number));
    const sortedList = systemEntry.systems.sort(
      (s1, s2) => s1.number - s2.number,
    );

    const metaConfig = {
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
function getID() {
  _incriment++;
  return Math.floor(Math.random() * 1000000000 + _incriment);
}
const initialUserProject = {
  configs: [],
  userSystems: [],
  projectDetails: {},
  id: getID(),
};

export default function (set, get) {
  return {
    activeProject: initialUserProject.id,
    userProjects: [initialUserProject],
    userSystems: [],
    configurations: [],
    saveProjectDetails: (projectDetails) =>
      _saveProjectDetails(projectDetails, set),
    getActiveProject: () => _getActiveProject(get),
    setActiveProject: (userProject) => set({ activeProject: userProject.id }),
    getActiveTemplates: (sort = sortByName) =>
      sort ? _getActiveTemplates(get).sort(sort) : _getActiveTemplates(get),
    getConfigs: (template = undefined, sort = sortByName) =>
      sort ? _getConfigs(template, get).sort(sort) : _getConfigs(template, get),
    addConfig: (template, attrs = {}) => _addConfig(template, attrs, set),
    updateConfig: (config, configName, selections) =>
      _updateConfig(config, configName, selections, set),
    removeConfig: (config) => _removeConfig(config, set),
    toggleConfigLock: (configId) => {
      set(
        produce((state) => {
          const config = state.configurations.find(({ id }) => id === configId);
          if (config) config.isLocked = !config.isLocked;
        }),
      );
    },
    removeAllTemplateConfigs: (template) =>
      _removeAllTemplateConfigs(template, set),
    addUserSystems: (prefix, start, quantity, config) =>
      _addUserSystems(prefix, start, quantity, config, set),
    getUserSystems: (template = undefined, sort?) =>
      _getUserSystems(template, get),
    updateUserSystem: (system, tag, config, scheduleList) =>
      _updateUserSystem(system, tag, config, scheduleList, set),
    removeUserSystem: (userSystem) => _removeUserSystem(userSystem, set),
    getMetaConfigs: (
      template = undefined,
      sort = (m1, m2) => m1.config.name.localeCompare(m2.config.name),
    ) =>
      sort
        ? _getMetaConfigs(template, get).sort(sort)
        : _getMetaConfigs(template, get),
  };
}
