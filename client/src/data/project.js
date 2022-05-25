import { makeAutoObservable, autorun } from "mobx";
import persist from "./persist";
import { poj } from "../utils/utils";
import { v4 as uuid } from "uuid";

const { projects, activeProjectId } = persist.storage;

const DEFAULT_PROJECT = {
  userSystems: [],
  projectDetails: {
    name: "",
    address: "",
    type: "Multi-Story Office",
    size: 0,
    units: "IP",
    code: "ashrae 90.1 20201",
    notes: "",
  },
  id: uuid(),
};

// const projectSchema = {
//   userSystems: [
//     { modelicaPath: "", userConfigs: [{ modelicaPath: "", configs: [] }] },
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
        projects: poj(this.projects),
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

  get activeProject() {
    return this.projects.find((pj) => pj.id === this.activeProjectId);
  }
}
