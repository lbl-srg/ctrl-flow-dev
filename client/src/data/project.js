import { makeAutoObservable, autorun } from "mobx";
import persist from "./persist";
import { v4 as uuid } from "uuid";

const { projects, activeProjectId } = persist.storage;

const DEFAULT_PROJECT = {
  userSystems: [],
  projectDetails: {},
  id: uuid(),
};

// const projectSchema = {
//   userSystems: [
//     { modelicaPath: "", templates: [{ modelicaPath: "", configs: [] }] },
//   ],
// };

export default class Project {
  projects = projects || [DEFAULT_PROJECT];
  activeProjectId = activeProjectId || DEFAULT_PROJECT.id;

  constructor(rootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this);

    autorun(() => {
      persist.storage = {
        projects: this.projects,
        activeProjectId: this.activeProjectId,
      };
    });
  }

  addUserConfig(systemPath, templatePath, config = { name: "Default" }) {
    this.activeProject.userSystems.push({
      modelicaPath: systemPath,
      templates: [],
    });
  }

  setActiveProjectId(id) {
    this.activeProjectId = id;
  }

  setProjectDetails(details) {
    this.activeProject.projectDetails = details;
  }

  get activeProject() {
    return this.projects.find((pj) => pj.id === this.activeProjectId);
  }
}
