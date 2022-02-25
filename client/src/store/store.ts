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

export interface Selection {
  id: number;
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
  selections: Option[] | undefined;
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
  userProject: UserProject;
  configurations: Configuration[];
  addConfig: SetAction<Configuration>;
  updateConfig: SetAction<ConfigUpdatePayload>
  removeConfig: SetAction<Configuration>;
  removeAllConfigs: SetAction<System>;
  // addSystem: SetAction<System>;//(system: System) => void;
  // removeSystem: SetAction<System>;
  // addConfig: (system: System) => void;
  // updateConfig: (config: Partial<Configuration> & { id: number; system: number }, configName: string, selections: Option[]) => void;
  // removeConfig: (config: Configuration) => void;
}

const initialUserProject: UserProject = {configs: [], metaConfigs: [], schedules: []}

const saveProjectDetails: SetAction<Partial<ProjectDetails>> = (projectDetails, set) => {
  set(() => ({projectDetails}))
}

const addConfig: SetAction<Configuration> = (config, set) => {
  set(
    produce((state: State) => {
      state.userProject.configs = state.userProject?.configs
        ? [...(state.userProject.configs as number[]), config.id]
        : [config.id];
    }),
  )
}


interface UpdateConfigPayload {
  config: Partial<Configuration> & { id: number; system: number };
  configName: string;
  selections: Selection[];
}

const updateConfig: SetAction<UpdateConfigPayload> = (payload, set) =>
  produce((state: State) => {
    const conf = state.configurations.find(c => c.id === payload.config.id);
    // for each selection
    if (conf) {
      conf.name = payload.configName;
      // conf.selections = payload.selections;
    }
  }
)

//       updateConfig: (
//         config: Partial<Configuration> & { id: number; system: number },
//         configName: string,
//         selections: Option[]
//       ) =>
//         set(
//           produce((state: State) => {
//             const conf = state.userProjects.configurations.find(c => c.id === config.id);
//             if (conf) {
//               conf.name = configName;
//               conf.selections = selections;
//             }
//           }),
//         ),

const removeConfig: SetAction<Configuration> = (config, set) => {
  set(
    produce((state: State) => {
      state.userProject.configs =
        state.userProject.configs?.filter(cID => cID !== config.id) ||
        state.userProject.configs;
    }),
  )
}

const removeAllConfigs: SetAction<SystemTemplate> = (template, set) => {
  set(
    produce((state: State) => {
      const configs = state.configurations;
      const userSystemConfigs =
        state.userProject.configs.map(cID => configs.find(c => c.id === cID)) as Configuration[];
      state.userProject.configs = userSystemConfigs
        .filter(c => c.template !== template.id)
        .map(c => c.id);
    }),
  )
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
      userProject: initialUserProject,
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


// export const useStore = create<State>(
//   persist(
//     (set, get) => ({
//       projectDetails: {},
//       saveProjectDetails: (projectDetails: Partial<ProjectDetails>) =>
//         set(() => ({ projectDetails })),
//       systemTypes: mockData["systemTypes"],
//       systems: mockData['systems'],
//       options: mockData['options'],
//       userProjects: {
//         systems: [],
//         configurations: [],
//         metaConfigurations: [],
//         schedules: null,
//       },
//       addSystem: (system: System) =>
//         set(
//           produce((state: State) => {
//             state.userProjects.systems = state.userProjects?.systems
//               ? [...(state.userProjects.systems as System[]), system]
//               : [system];
//           }),
//         ),
      // removeSystem: (system: System) =>
      //   set(
      //     produce((state: State) => {
      //       state.userProjects.systems =
      //         state.userProjects.systems?.filter((s) => s.id !== system.id) ||
      //         state.userProjects.systems;
      //     }),
      //   ),
//       addConfig: (system: System) => {
//         set(
//           produce((state: State) => {
//             const config = {
//               system: system.id,
//               name: "Test",
//               id: getID(),
//               selections: [],
//             };
//             state.userProjects.configurations = state.userProjects
//               ?.configurations
//               ? [...state.userProjects.configurations, config]
//               : [config];
//           }),
//         );
//       },
//       removeConfig: (config: Configuration) =>
//         set(
//           produce((state: State) => {
//             state.userProjects.configurations =
//               state.userProjects.configurations?.filter(
//                 (c) => c.id !== config.id,
//               ) || state.userProjects.configurations;
//           }),
//         ),
//       updateConfig: (
//         config: Partial<Configuration> & { id: number; system: number },
//         configName: string,
//         selections: Option[]
//       ) =>
//         set(
//           produce((state: State) => {
//             const conf = state.userProjects.configurations.find(c => c.id === config.id);
//             if (conf) {
//               conf.name = configName;
//               conf.selections = selections;
//             }
//           }),
//         ),
//     }),
//     {
//       name: "linkage-storage",
//     },
//   ),
// );

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
