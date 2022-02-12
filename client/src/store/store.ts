import create from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

import mockData from "./system.json";

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
  type: string;
  name: string;
  options?: number[];
  group?: string;
}

export interface SystemTemplates {
  systems: System[];
  options: Option[];
}

export interface Configuration {
  id: number;
  system: number; // ID of system
  name: string;
  selections: Selection[];
}

export interface MetaConfiguration {
  tagPrefix: string;
  tagStartIndex: number;
  quantity: number;
  configuration: number; // configuration ID
}

export interface selection {
  modelicaPath: string; // e.g. Buildings.Templates.Components.Types.Valve.ThreeWay
  option: number; // option id
  selection: number; // option id
  value?: any; // number/boolean/enu
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
  systemTypes: SystemType[];
  templates: SystemTemplates;
  setTemplates: (templates: SystemTemplates) => void;
  userProjects: UserProjects;
  addSystem: (system: System) => void;
  removeSystem: (system: System) => void;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      projectDetails: {},
      saveProjectDetails: (projectDetails: Partial<ProjectDetails>) =>
        set(() => ({ projectDetails })),
      systemTypes: mockData["systemTypes"],
      templates: { systems: mockData["systems"], options: mockData["options"] },
      setTemplates: (templates: Partial<SystemTemplates>) =>
        set(() => {
          templates;
        }),
      userProjects: {
        systems: [],
        configurations: [],
        metaConfigurations: [],
        schedules: null,
      },
      addSystem: (system: System) =>
        set(
          produce((state: State) => {
            state.userProjects.systems = state.userProjects?.systems
              ? [...(state.userProjects.systems as System[]), system]
              : [system];
          }),
        ),
      removeSystem: (system: System) =>
        set(
          produce((state: State) => {
            state.userProjects.systems =
              state.userProjects.systems?.filter((s) => s.id !== system.id) ||
              state.userProjects.systems;
          }),
        ),
    }),
    {
      name: "linkage-storage",
    },
  ),
);

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
