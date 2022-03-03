import create, {SetState, GetState} from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

import mockData from "./mock-data.json";

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

export interface Option {
  id: number;
  type: string;
  name: string;
  options?: Option[];
  group?: string;
  modelicaPath?: string;
  value?: number | boolean;
}

export type SelectionN = {
  parent: number;
  option: number;
  value?: number | boolean | string;
}

export type Selection = {
  parent: Option;
  option: Option; // TODO: remove this 'option' key and add 'Option' as a possible type for value
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
  template: SystemTemplate;
  name: string | undefined;
  selections: Selection[];
}

export interface MetaConfigurationN {
  id: number;
  tagPrefix: string;
  tagStartIndex: number;
  quantity: number;
  configuration: number; // configuration ID
}

export interface MetaConfiguration {
  id: number;
  tagPrefix: string;
  tagStartIndex: number;
  quantity: number;
  configuration: Configuration;
}

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

const initialUserProject: UserProjectN = {configs: [], metaConfigs: [], schedules: [], projectDetails: {}, id: getID()};

/**
 * Returns a denormalized user project
 */
const _getActiveProject: GetAction<UserProject> = (get) => {
  const activeProjectN = get().userProjects.find(uProject => uProject.id === get().activeProject) as UserProjectN;
  const activeProject = {}

  return {
    id: activeProjectN.id,
    configs: get().getConfigs(),
    metaConfigs: get().getMetaConfigs(),
    schedules: [],
    projectDetails: activeProjectN.projectDetails
  }
}

const _getTemplates: GetAction<SystemTemplate[]> = (get) => {
  const templatesN = get().templates;
  const options = _getAllOptions(get);

  return templatesN.map(t => ({
      id: t.id,
      systemType: get().systemTypes.find(sType => sType.id === t.systemType) as SystemType,
      name: t.name,
      options: t.options?.map(oID => options.find(o => oID === o.id)) as Option[]
    }))
}

const _getActiveTemplates: GetAction<SystemTemplate[]> = (get) => {
  const configs = get().getConfigs();
  const activeTemplateSet = new Set(configs.map(c => c.template));
  return Array.from(activeTemplateSet.values());
}

const _getAllOptions: (get: GetState<State>) => Option[] = (get) => {
  // denormalize list in two passes: first create options without child options
  // then populate child options after references have been created
  const optionsN = get().options
  const options = optionsN.map(o => ({...o, ...{options: undefined}}) as Option);
  options.map(o => {
    const optionN = optionsN.find(option => option.id === o.id) as OptionN;
    if (optionN.options) {
      o.options =
        optionN.options.map(cID => options.find(option => cID === option.id) as Option)
    }
  });

  return options;
}

// for a given template, returns two lists: the initial options and all available options
const _getOptions: (template: SystemTemplate, get: GetState<State>) => [Option[], Option[]]= (template, get) => {
  const optionIDs: number[] = [];
  const templateOptionsN: OptionN[] = [];
  const initOptions = template.options as Option[];

  if (template.options) {
    const options = get().options;
    optionIDs.push(...template.options.map(o => o.id));

    while (optionIDs.length > 0) {
      const curID = optionIDs.pop();
      const curNode = options.find(o => o.id === curID) as OptionN;
      if (curNode.options) {
        optionIDs.push(...curNode.options);
      }
      templateOptionsN.push(curNode);
    }
  }

  const options = _getAllOptions(get);
  const templateOptions = templateOptionsN.map(o => options.find(option => option.id === o.id) as Option);

  return [initOptions, templateOptions];
}

const _getConfigs: GetAction<Configuration[]> = (get) => {
  const configs = get().configurations;
  const activeProject = get().userProjects.find(proj => proj.id === get().activeProject) as UserProjectN
  const projectConfigs = configs.filter(c => activeProject.configs.indexOf(c.id) >= 0);

  return _getConfigsHelper(projectConfigs, get);
}

const _getConfigsHelper: (configs: ConfigurationN[], get: GetState<State>) => Configuration[] = (configs, get) => {
  const templates = get().getTemplates();
  return configs.map(config => ({
    id: config.id,
    template: templates.find(t => t.id === config.template) as SystemTemplate,
    name: config.name,
    selections: config.selections.map(s => ({
      parent: get().options.find(o => o.id === s.parent) as Option,
      option: get().options.find(o => o.id === s.option) as Option,
      value: s.value
    }))
  }));
}

const _getMetaConfigs: GetAction<MetaConfiguration[]> = (get) => {
  const configs = get().getConfigs();
  const metaConfigs = get().metaConfigurations;
  const userProject = get().userProjects.find(proj => proj.id === get().activeProject) as UserProjectN
  const projectMetaConfigs = metaConfigs.filter(mConfig => userProject.metaConfigs.indexOf(mConfig.id) >=0)

  return get().metaConfigurations.map(mConf => ({
    id: mConf.id,
    tagPrefix: mConf.tagPrefix,
    tagStartIndex: mConf.tagStartIndex,
    quantity: mConf.quantity,
    configuration: configs.find(c => c.id === mConf.configuration) as Configuration
  }));
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


const _addConfig = (template: SystemTemplate, attrs: Partial<ConfigurationN>, set: SetState<State>) => {
  set(
    produce((state: State) => {
      const activeProject = state.userProjects.find(proj => proj.id === state.activeProject);
      if (activeProject) {
        const configDefaults = {id: getID(), template: template.id, name: '', selections: []};
        const config = {...configDefaults, ...attrs};
        activeProject.configs.push(config.id);
        state.configurations.push(config);
      }
    }),
  )
}

/**
 * Helper method that given a set of new selections, makes sure no-longer relevant child
 * selections are removed from the provided config, then combines that filtered list
 * of previous selections with the new ones
 */
const getFilteredSelectionList = (state: State, selections: Selection[], newSelections: Selection[]) => {
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

  const previousSelections = (selections) ?
    selections.filter(s => !filterList.includes(s.parent.id)) : [];

  // combine the filtered list of old selections + the new selections
  return [...previousSelections,
    ...newSelections];
}

const _updateConfig = (config: Configuration, configName: string, selections: Selection[], set: SetState<State>) =>
  set(
    produce((state: State) => {
      const conf = state.configurations.find(c => c.id === config.id) as ConfigurationN;

      conf.name = configName;
      const updatedSelections = getFilteredSelectionList(state, config.selections, selections);
      // convert to normalized format
      conf.selections = updatedSelections.map(s => ({
        parent: s.parent.id,
        option: s.option.id,
        value: s.value
      }));
    })
)

const _removeConfig: SetAction<Configuration> = (config, get, set) => {
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

const _removeAllTemplateConfigs: SetAction<SystemTemplate> = (template, get, set) => {
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

export interface State {
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
  getActiveTemplates: () => SystemTemplate[],
  getConfigs: () => Configuration[];
  getMetaConfigs: () => MetaConfiguration[];
  addConfig: (template: SystemTemplate, attrs?: Partial<ConfigurationN>) => void; // TODO: on template add, default config must be added
  updateConfig: (config: Configuration, configName: string, selections: Selection[]) => void;
  removeConfig: (config: Configuration) => void;
  removeAllTemplateConfigs: (template: SystemTemplate) => void;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      saveProjectDetails: projectDetails => saveProjectDetails(projectDetails, get, set),
      systemTypes: mockData['systemTypes'],
      templates: mockData['templates'],
      options: mockData['options'],
      configurations: [],
      metaConfigurations: [],
      userProjects: [initialUserProject],
      activeProject: 1,
      getActiveProject: () => _getActiveProject(get),
      setActiveProject: (userProject: UserProject) => set({activeProject: userProject.id}),
      getOptions: () => _getAllOptions(get),
      getTemplates: () => _getTemplates(get),
      getTemplateOptions: (template: SystemTemplate) => _getOptions(template, get),
      getActiveTemplates: () => _getActiveTemplates(get),
      addConfig: (template: SystemTemplate, attrs={}) => _addConfig(template, attrs, set),
      getConfigs: () => _getConfigs(get),
      getMetaConfigs: () => _getMetaConfigs(get),
      updateConfig: (config: Configuration, configName: string, selections: Selection[]) =>
        _updateConfig(config, configName, selections, set),
      removeConfig: (config: Configuration) => _removeConfig(config, get, set),
      removeAllTemplateConfigs: (template: SystemTemplate) => _removeAllTemplateConfigs(template, get, set)
    }),
    {
      name: "linkage-storage",
    }
  )
)