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
  id: number;
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
  projectDetails: Partial<ProjectDetails>;
  id: number;
}

type GetAction<T> = (get: GetState<State>) => T;
type SetAction<T> = (payload: T, get: GetState<State>, set: SetState<State>) => void
// type SetActionWithGet<T> = (payload: T, set: SetState<State>, get: GetState<State>) => void;

export interface State {
  saveProjectDetails: SetAction<Partial<ProjectDetails>>;
  systemTypes: SystemType[];
  templates: SystemTemplate[];
  options: Option[];
  userProjects: UserProject[];
  activeProject: number;
  getActiveProject: GetAction<UserProject>;
  setActiveProject: SetAction<UserProject>;
  configurations: Configuration[];
  addConfig: SetAction<Configuration>; // TODO: on template add, default config must be added
  updateConfig: SetAction<UpdateConfigPayload>
  removeConfig: SetAction<Configuration>;
  removeAllTemplateConfigs: SetAction<SystemTemplate>;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      saveProjectDetails: projectDetails => saveProjectDetails(projectDetails, get, set),
      systemTypes: [],
      templates: [],
      options: [],
      configurations: [],
      userProjects: [initialUserProject],
      activeProject: 1, // hard coding this for now
      getActiveProject: () => getActiveProject(get),
      setActiveProject: (payload) => setActiveProject(payload, get, set),
      addConfig: (config) => addConfig(config, get, set),
      updateConfig: (payload) => updateConfig(payload, get, set),
      removeConfig: (config) => removeConfig(config, get, set),
      removeAllTemplateConfigs: (template) => removeAllTemplateConfigs(template, get, set)
    }),
    {
      name: "linkage-storage",
    }
  )
)

const initialUserProject: UserProject = {configs: [], metaConfigs: [], schedules: [], projectDetails: {}, id: getID()};

const saveProjectDetails: SetAction<Partial<ProjectDetails>> = (projectDetails, get, set) =>
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(project => project.id === state.activeProject);
      if (activeProject) {
        activeProject.projectDetails = {...activeProject?.projectDetails, ...projectDetails};
      }
    })
  )


const addConfig: SetAction<Configuration> = (config, get, set) => {
  set(
    produce((state: State) => {
      const activeProject = state.getActiveProject(get);
      activeProject.configs = [...activeProject.configs as number[], config.id]
      state.configurations.push(config);
    }),
  )
}

const setActiveProject: SetAction<UserProject> = (userProject, get, set) => set({activeProject: userProject.id});
const getActiveProject: GetAction<UserProject> = get =>
  get().userProjects.find(uProject => uProject.id === get().activeProject)
  || initialUserProject;

  /**
 * Helper method that given a set of new selections, makes sure no-longer relevant child
 * selections are removed from the provided config
 */
const filterOldSelections = (state: State, conf: Configuration, newSelections: Selection[]) => {
  const options = state.options;
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

  // combine the filtered list of old selections + the new selections
  return [...conf.selections.filter(s => !filterList.includes(s.parent)),
    ...newSelections];
}

interface UpdateConfigPayload {
  config: Partial<Configuration> & { id: number; system: number };
  configName: string;
  selections: Selection[];
}

const updateConfig: SetAction<UpdateConfigPayload> = (payload, get, set) =>
  produce((state: State) => {
    const conf = state.configurations.find(c => c.id === payload.config.id);
    // for each selection
    if (conf) {
      conf.name = payload.configName;
      conf.selections = filterOldSelections(state, conf, payload.selections);
    }
  }
)

const removeConfig: SetAction<Configuration> = (config, get, set) => {
  set(
    produce((state: State) => {
      const configs = get().getActiveProject(get).configs
      get().getActiveProject(get).configs = configs.filter(cID => cID !== config.id)
      state.configurations = state.configurations.filter(c => c.id !== config.id);
    }),
  )
}

const removeAllTemplateConfigs: SetAction<SystemTemplate> = (template, get, set) => {
  set(
    produce((state: State) => {
      const configs = state.configurations;
      const activeProject = get().getActiveProject(get);
      const configsToRemove = activeProject.configs
        .map(cID => configs.find(c => c.id === cID) as Configuration)
        .filter(c => c.template === template.id)
        .map(c => c.id);

      activeProject.configs = activeProject.configs.filter(cID => !configsToRemove.includes(cID))
      state.configurations = configs.filter(c => !configsToRemove.includes(c.id));
    }),
  )
}

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
