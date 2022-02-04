import create from "zustand";
import { persist } from "zustand/middleware";

import mockTemplates from "./system.json";

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

export interface Option {
  id: number;
  type: "dropdown" | "string" | "boolean" | "number" | "final";
  name: string;
  options?: Option[];
}

export interface SystemTemplates {
  systemType: SystemType[];
  system: System[];
  options: Option[];
}

export interface Configuration {
  id: number;
  system: number; // ID of system
  name: string;
  configuration: any; // this is dynamically generated from modelica template selections
}

export interface MetaConfiguration {
  tagPrefix: string;
  tagStartIndex: number;
  quantity: number;
  configuration: number; // configuration ID
}

export interface UserProjects {
  systems: System[];
  configurations: Configuration[];
  metaConfigurations: MetaConfiguration[];
  schedules: any;
}

export interface State {
  projectDetails: Partial<ProjectDetails>;
  saveProjectDetails: (projectDetails: Partial<ProjectDetails>) => void;
  templates?: SystemTemplates;
  setTemplates: (templates: SystemTemplates) => void;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      projectDetails: {},
      saveProjectDetails: (projectDetails: Partial<ProjectDetails>) =>
        set(() => ({ projectDetails })),
      setTemplates: (templates: Partial<SystemTemplates>) =>
        set(() => {
          templates;
        }),
    }),
    {
      name: "linkage-storage",
    },
  ),
);

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);

// intialize mock values
useStore.setState({ templates: mockTemplates as SystemTemplates });
