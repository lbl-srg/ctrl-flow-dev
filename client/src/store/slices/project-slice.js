import { v4 as uuid } from "uuid";
import { produce } from "immer";

const initialUserProject = {
  // configs: [],
  userSystems: [],
  projectDetails: {},
  id: uuid(),
};

const _findActiveProject = (state) =>
  state.projects.find((project) => project.id === state.activeProject);

export default function (set, get) {
  return {
    activeProject: initialUserProject.id,
    projects: [initialUserProject],

    addUserSystem(modelicaPath) {
      const userSystem = { modelicaPath, templates: [] };
      set(
        produce((state) => {
          _findActiveProject(state).userSystems.push(userSystem);
        }),
      );
    },

    setActiveProject: ({ id }) => set({ activeProject: id }),
    saveProjectDetails: (projectDetails) => {
      set(
        produce((state) => {
          const activeProject = _findActiveProject(state);

          activeProject.projectDetails = {
            ...(activeProject?.projectDetails || {}),
            ...projectDetails,
          };
        }),
      );
    },
    getActiveProject: () => {
      return get().projects.find(({ id }) => id === get().activeProject);
    },
  };
}
