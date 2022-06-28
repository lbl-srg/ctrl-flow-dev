import { v4 as uuid } from "uuid";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import RootStore from ".";

export interface ProjectDetailInterface {
  name: string;
  address: string;
  type: string;
  size: number;
  units: string;
  code: string;
  notes: string;
}

export interface ProjectInterface {
  id: string;
  projectDetails: ProjectDetailInterface;
}

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

export default class Project {
  projects = [DEFAULT_PROJECT];
  activeProjectId = DEFAULT_PROJECT.id;

  rootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this);

    makePersistable(this, {
      name: this.rootStore.getStorageKey("projects"),
      properties: ["projects", "activeProjectId"],
    });
  }

  setActiveProjectId(id: string) {
    this.activeProjectId = id;
  }

  setProjectDetails(details: ProjectDetailInterface) {
    const project = this.activeProject;
    if (project) project.projectDetails = details;
  }

  get projectDetails(): ProjectDetailInterface | undefined {
    return this.activeProject?.projectDetails;
  }

  get activeProject(): ProjectInterface | undefined {
    return this.projects.find((pj) => pj.id === this.activeProjectId);
  }
}
