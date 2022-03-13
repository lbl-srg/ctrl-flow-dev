import { Option, SystemTemplate, SetAction } from "../../store";
import { SortableByName } from "../../../utils/utils";

export interface UserStateInterface {
  configurations: ConfigurationN[];
  userProjects: UserProjectN[];
  userSystems: UserSystemN[];
  activeProject: number;
}

export interface UserActionsInterface {
  saveProjectDetails: (projectDetails: Partial<ProjectDetails>) => void;
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
  removeUserSystem: (system: UserSystem | UserSystemN) => void;
  getMetaConfigs: (
    template?: SystemTemplate,
    sort?: CompareFunction<MetaConfiguration> | null | undefined,
  ) => MetaConfiguration[];
}

export interface UserSliceInterface
  extends UserStateInterface,
    UserActionsInterface {}

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

export type CompareFunction<T> = (a: T, b: T) => number;

export interface Selection extends Omit<SelectionN, "parent" | "option"> {
  parent: Option;
  option: Option; // TODO: remove this 'option' key and add 'Option' as a possible type for value
}

export interface ConfigurationN {
  id: number;
  template: number; // ID of SystemTemplate
  name: string;
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
