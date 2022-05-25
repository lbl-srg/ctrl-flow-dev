import { makeAutoObservable, autorun } from "mobx";
import persist from "./persist";
import { v4 as uuid } from "uuid";

const { projects, activeProjectId } = persist.storage;

const DEFAULT_PROJECT = {
  userSystems: [],
  projectDetails: {},
  id: uuid(),
};

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

  setActiveProjectId(id) {
    this.activeProjectId = id;
  }

  setProjectDetails(details) {
    this.activeProject.projectDetails = details;
  }

  addUserSystem(path) {
    const userSystem = { modelicaPath: path, templates: [] };
    this.activeProject.userSystems.push(userSystem);
  }

  get activeProject() {
    return this.projects.find((pj) => pj.id === this.activeProjectId);
  }
}
