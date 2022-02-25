import create, {SetState, GetState} from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

import mockData from "./system.json";

// TODO... get a better uid system
let _idIncrement = 1;
const getID = () => (_idIncrement += 1);

export interface ProjectDetails {
  name: string;
  address: string;
  type: "multi-story office" | "warehouse" | "something else";
  size: number;
  units: "ip" | "something";
  code: "ashrae 90.1 20201" | "a different one";
  notes: string;
}

export interface SystemType {
  id: number;
  name: string;
}

export interface System {
  id: number;
  name: string;
  systemType: number;
  options?: number[];
}

// modelicaPath+name should be the unique identifier for options
export interface Option {
  id: number;
  type: string;
  name: string;
  options?: number[];
  group?: string;
  modelicaPath?: string;
  value?: number | boolean;
}

// export interface Selection {
//   id: number;
//   parent: number;
//   option: number;
//   value?: number | boolean | string;
// }

export type Selection = {
  parent: number;
  option: number;
  value?: number | boolean | string;
}

export interface SystemTemplate {
  id: number;
  systemType: number;
  name: string;
  options?: number[];
}

export interface Configuration {
  id: number;
  template: number; // ID of SystemTemplate
  name: string | undefined;
  selections: Selection[];
}

export interface MetaConfiguration {
  tagPrefix: string;
  tagStartIndex: number;
  quantity: number;
  configuration: number; // configuration ID
}

// export interface UserProjects {
//   systems: System[];
//   configurations: Configuration[];
//   metaConfigurations: MetaConfiguration[];
//   schedules: any;
// }

export interface UserProject {
  configs: number[];
  metaConfigs: number[];
  schedules: number[];
}

type SetAction<T> = (payload: T, set: SetState<State>) => void

export interface State {
  projectDetails: Partial<ProjectDetails>;
  saveProjectDetails: (projectDetails: Partial<ProjectDetails>) => void;
  systemTypes: SystemType[];
  templates: SystemTemplate[];
  options: Option[];
  userProjects: UserProject[];
  activeProject: UserProject;
  configurations: Configuration[];
  addConfig: SetAction<Configuration>; // TODO: on template add, default template must be added
  updateConfig: SetAction<UpdateConfigPayload>
  removeConfig: SetAction<Configuration>;
  removeAllConfigs: SetAction<System>;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      projectDetails: {},
      saveProjectDetails: projectDetails => saveProjectDetails(projectDetails, set),
      systemTypes: [],
      templates: [],
      options: [],
      configurations: [],
      userProjects: [initialUserProject],
      activeProject: initialUserProject,
      addConfig: addConfig,
      updateConfig: updateConfig,
      removeConfig: removeConfig,
      removeAllConfigs: removeAllConfigs
    }),
    {
      name: "linkage-storage",
    }
  )
)

const initialUserProject: UserProject = {configs: [], metaConfigs: [], schedules: []}

const saveProjectDetails: SetAction<Partial<ProjectDetails>> = (projectDetails, set) => {
  set(() => ({projectDetails}))
}

const addConfig: SetAction<Configuration> = (config, set) => {
  set(
    produce((state: State) => {
      state.activeProject.configs = state.activeProject?.configs
        ? [...(state.activeProject.configs as number[]), config.id]
        : [config.id];
    }),
  )
}


interface UpdateConfigPayload {
  config: Partial<Configuration> & { id: number; system: number };
  configName: string;
  selections: Selection[];
}

/**
 * Given a set of selections, make sure no-longer relevant selections are removed from
 * the provided config
 */
const pruneOldSelections = (state: State, conf: Configuration, newSelections: Selection[]) => {
  const options = state.options;
  // add the parent option of each selection to a remove list
  // add child nodes to the remove list
  const nodeList = newSelections.map(s => s.parent);
  const filterList: number[] = [];

  while (nodeList.length > 0) {
    const parentOption = options.find(o => o.id === nodeList.pop());
    if (parentOption) {
      const children = parentOption.options;
      if (children) {
        nodeList.push(...children);
      }
      filterList.push(parentOption.id);
    }
  }

  return [...conf.selections.filter(s => !filterList.includes(s.parent)),
    ...newSelections];
}

const updateConfig: SetAction<UpdateConfigPayload> = (payload, set) =>
  produce((state: State) => {
    const conf = state.configurations.find(c => c.id === payload.config.id);
    // for each selection
    if (conf) {
      conf.name = payload.configName;
      conf.selections = pruneOldSelections(state, conf, payload.selections);
    }
  }
)

const removeConfig: SetAction<Configuration> = (config, set) => {
  set(
    produce((state: State) => {
      state.activeProject.configs =
        state.activeProject.configs?.filter(cID => cID !== config.id) ||
        state.activeProject.configs;
    }),
  )
}

const removeAllConfigs: SetAction<SystemTemplate> = (template, set) => {
  set(
    produce((state: State) => {
      const configs = state.configurations;
      const userSystemConfigs =
        state.activeProject.configs.map(cID => configs.find(c => c.id === cID)) as Configuration[];
      state.activeProject.configs = userSystemConfigs
        .filter(c => c.template !== template.id)
        .map(c => c.id);
    }),
  )
}


export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
