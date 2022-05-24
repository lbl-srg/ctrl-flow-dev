import { v4 as uuid } from "uuid";
import { produce } from "immer";

const initialUserProject = {
  configs: [],
  userSystems: [],
  projectDetails: {},
  id: uuid(),
};

export default function (set, get) {
  return {
    activeProject: initialUserProject.id,
    projects: [initialUserProject],
    setActiveProject: ({ id }) => set({ activeProject: id }),
    saveProjectDetails: (projectDetails) => {
      set(
        produce((state) => {
          const activeProject = state.projects.find(
            (project) => project.id === state.activeProject,
          );
          if (activeProject) {
            activeProject.projectDetails = {
              ...activeProject?.projectDetails,
              ...projectDetails,
            };
          }
        }),
      );
    },
    getActiveProject: () => {
      return get().projects.find(({ id }) => id === get().activeProject);
    },
  };
}
