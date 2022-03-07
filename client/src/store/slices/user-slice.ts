import { SetState, GetState } from "zustand";
import { State, Option, SystemTemplate } from "../store";
import { produce } from "immer";

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
