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

export interface SystemN {
  id: number;
  name: string;
  systemType: number;
  options?: number[];
}

export interface System {
  id: number;
  name: string;
  systemType: SystemType;
  options?: Option[];
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

export interface Option {
  id: number;
  type: string;
  name: string;
  options?: Option[];
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

export type SelectionN = {
  parent: number;
  option: number;
  value?: number | boolean | string;
}

export type Selection = {
  parent: Option;
  option: Option;
  value?: number | boolean | string;
}

export interface SystemTemplateN {
  id: number;
  systemType: number;
  name: string;
  options?: number[];
}

export interface SystemTemplate {
  id: number;
  systemType: SystemType;
  name: string;
  options?: Option[];
}

export interface ConfigurationN {
  id: number;
  template: number; // ID of SystemTemplate
  name: string | undefined;
  selections: SelectionN[];
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

export interface UserProjectN {
  configs: number[];
  metaConfigs: number[];
  schedules: number[];
  projectDetails: Partial<ProjectDetails>;
  id: number;
}

export interface UserProject {
  configs: Configuration[];
  metaConfigs: MetaConfiguration[];
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
  templates: SystemTemplateN[];
  options: OptionN[];
  configurations: ConfigurationN[];
  userProjects: UserProjectN[];
  activeProject: number;
  // getActiveProject: () => UserProject;
  // setActiveProject: SetAction<UserProject>;
  // getSystemTemplates: GetAction<SystemTemplate[]>;
  getConfigs: GetAction<Configuration>;
  // addConfig: SetAction<Configuration>; // TODO: on template add, default config must be added
  // updateConfig: SetAction<UpdateConfigPayload>
  // removeConfig: SetAction<Configuration>;
  // removeAllTemplateConfigs: SetAction<SystemTemplate>;
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
      activeProject: 1,
      // getActiveProject: () => {
      //   return get().userProjects.find(uProject => uProject.id === get().activeProject)
      //     ||    initialUserProject;
      // },
      // setActiveProject: (userProject) => set({activeProject: userProject.id}),
      // getSystemTemplates: () => getSystemTemplates(get),
      // addConfig: (config) => addConfig(config, get, set),
      getConfigs: () => getConfigurations(get)
      // updateConfig: (payload) => updateConfig(payload, get, set),
      // removeConfig: (config) => removeConfig(config, get, set),
      // removeAllTemplateConfigs: (template) => removeAllTemplateConfigs(template, get, set)
    }),
    {
      name: "linkage-storage",
    }
  )
)

const initialUserProject: UserProjectN = {configs: [], metaConfigs: [], schedules: [], projectDetails: {}, id: getID()};

/**
 * Returns a denormalized user project
 */
const getActiveProjectHelper: GetAction<UserProject> = (get) => {
  const activeProjectN = get().userProjects.find(uProject => uProject.id === get().activeProject) as UserProjectN;
  const activeProject = {}

  return {
    configs: get().getConfigurations(),
    metaConfigs: get().getMetaConfigurations(),
    schedules: [],
    projectDetails: activeProjectN.projectDetails
  }
}

const getConfigurations: GetAction<Configuration> = (get) => {
  
}

const saveProjectDetails: SetAction<Partial<ProjectDetails>> = (projectDetails, get, set) =>
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(project => project.id === state.activeProject);
      if (activeProject) {
        activeProject.projectDetails = {...activeProject?.projectDetails, ...projectDetails};
      }
    })
  )


const addConfig: SetAction<SystemTemplate> = (template, get, set) => {
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(proj => proj.id === state.activeProject);
      if (activeProject) {
        const config = {id: getID(), template: template.id, name: '', selections: []};
        activeProject.configs = [...activeProject.configs as number[], config.id]
        state.configurations.push(config);
      }
    }),
  )
}

const getSystemTemplates: GetAction<SystemTemplate[]> = get => {
  const configs = get().configurations;
  const activeProject = get().getActiveProject();

  const systemTemplates = get().getActiveProject().configs
    .map(cID => activeProject.configs.find(configID => configID === cID) as Configuration)
    .map(c => c.template)

  // remove duplicates
  const systemTemplatesSet = new Set(systemTemplates);

  const systemTemplatesN =
    get().templates.filter(template => systemTemplatesSet.has(template.id));

  // create and return denormalized instances
  return systemTemplatesN.map(template =>
    ({
      id: template.id,
      systemType: get().systemTypes.find(t => t.id === template.systemType) as SystemType,
      name: template.name,
      options: template.options?.map(oID => get().options.find(o => o.id === oID)) as Option[]
    })
  )
}

type ConfigUpdate = Partial<Configuration> & { id: number; system: number }

interface UpdateConfigPayload {
  config: ConfigUpdate;
  configName: string;
  selections: Selection[];
}

  /**
 * Helper method that given a set of new selections, makes sure no-longer relevant child
 * selections are removed from the provided config, then combines that filtered list
 * of previous selections with the new ones
 */
const getFullSelectionList = (state: State, conf: ConfigUpdate, newSelections: Selection[]) => {
  const options = state.options;
  const nodeList = newSelections.map(s => s.parent);
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

  const previousSelections = (conf.selections) ?
    conf.selections.filter(s => !filterList.includes(s.parent.id)) : [];

  // combine the filtered list of old selections + the new selections
  return [...previousSelections,
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

    if (conf) {
      conf.name = payload.configName;
      const selections = getFullSelectionList(state, payload.config, payload.selections);
      // convert to normalized format
      conf.selections = selections.map(s => ({
        parent: s.parent.id,
        option: s.option.id,
        value: s.value
      }));
    }
  }
)

const removeConfig: SetAction<Configuration> = (config, get, set) => {
  set(
    produce((state: State) => {
      const configs = get().getActiveProject().configs
      const activeProject = state.userProjects.find(proj => proj.id === state.activeProject);

      if (activeProject) {
        activeProject.configs = activeProject.configs.filter(cID => cID !== config.id);
      }

      state.configurations = state.configurations.filter(c => c.id !== config.id);
    }),
  )
}

const removeAllTemplateConfigs: SetAction<SystemTemplate> = (template, get, set) => {
  set(
    produce((state: State) => {
      const configs = state.configurations;
      const activeProject = get().getActiveProject();
      const configsToRemove = activeProject.configs
        .map(config => configs.find(c => c.id === config.id) as ConfigurationN)
        .filter(c => c.template === template.id)
        .map(c => c.id);

      activeProject.configs = activeProject.configs.filter(c => !configsToRemove.includes(c.id))
      state.configurations = configs.filter(c => !configsToRemove.includes(c.id));
    }),
  )
}

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
