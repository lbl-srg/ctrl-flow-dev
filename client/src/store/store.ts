import create from "zustand";
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

export interface SystemTemplates {
  systems: System[];
  options: Option[];
}

export interface Configuration {
  id: number;
  system: number; // ID of system
  name: string | undefined;
  selections: Option[] | undefined;
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
  systemTypes: SystemType[];
  templates: SystemTemplates;
  setTemplates: (templates: SystemTemplates) => void;
  userProjects: UserProjects;
  addSystem: (system: System) => void;
  removeSystem: (system: System) => void;
  addConfig: (system: System) => void;
  updateConfig: (config: Partial<Configuration> & { id: number; system: number }, configName: string, selections: Option[]) => void;
  removeConfig: (config: Configuration) => void;
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
      addConfig: (system: System) => {
        set(
          produce((state: State) => {
            const config = {
              system: system.id,
              name: "Test",
              id: getID(),
              selections: [],
            };
            state.userProjects.configurations = state.userProjects
              ?.configurations
              ? [...state.userProjects.configurations, config]
              : [config];
          }),
        );
      },
      removeConfig: (config: Configuration) =>
        set(
          produce((state: State) => {
            state.userProjects.configurations =
              state.userProjects.configurations?.filter(
                (c) => c.id !== config.id,
              ) || state.userProjects.configurations;
          }),
        ),
      updateConfig: (
        config: Partial<Configuration> & { id: number; system: number },
        configName: string,
        selections: Option[]
      ) =>
        set(
          produce((state: State) => {
            const conf = state.userProjects.configurations.find(c => c.id === config.id);
            if (conf) {
              conf.name = configName;
              conf.selections = selections;
            }
          }),
        ),
    }),
    {
      name: "linkage-storage",
    },
  ),
);

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
