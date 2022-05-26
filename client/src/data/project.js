import { v4 as uuid } from "uuid";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

const DEFAULT_PROJECT = {
  id: uuid(),
  projectDetails: {
    name: "",
    address: "",
    type: "Multi-Story Office",
    size: 0,
    units: "IP",
    code: "ashrae 90.1 20201",
    notes: "",
  },
};

// const projectSchema = {
//   userSystems: [
//     { modelicaPath: "", userConfigs: [{ modelicaPath: "", configs: [] }] },
//   ],
// };

export default class Project {
  projects = [DEFAULT_PROJECT];
  activeProjectId = DEFAULT_PROJECT.id;

  constructor(rootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this);

    makePersistable(this, {
      name: this.rootStore.getStorageKey("projects"),
      properties: ["projects", "activeProjectId"],
    });
  }

  setActiveProjectId(id) {
    this.activeProjectId = id;
  }

  setProjectDetails(details) {
    this.activeProject.projectDetails = details;
  }

  get projectDetails() {
    return this.activeProject.projectDetails;
  }

  get activeProject() {
    return this.projects.find((pj) => pj.id === this.activeProjectId);
  }
}
