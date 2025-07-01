import { v4 as uuid } from "uuid";
import { toJS } from "mobx";
import RootStore from ".";
import { ConfigValues } from "../utils/modifier-helpers";

export interface ProjectDetailInterface {
  name: string;
  address: string;
  type: string;
  size: number;
  notes: string;
  selections: ConfigValues;
  evaluatedValues: ConfigValues;
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
    notes: "",
    selections: {},
    evaluatedValues: {},
  },
};

export default class Project {
  projects = [DEFAULT_PROJECT];
  activeProjectId = DEFAULT_PROJECT.id;

  rootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  setActiveProjectId(id: string) {
    this.activeProjectId = id;
  }

  setProjectDetails(details: ProjectDetailInterface) {
    const project = this.activeProject;
    if (project) project.projectDetails = details;
  }

  getProjectDetails(): ProjectDetailInterface | undefined {
    return toJS(this.activeProject?.projectDetails);
  }

  getProjectSelections(): ConfigValues {
    const projectDetails = this.activeProject?.projectDetails;
    return toJS(projectDetails?.selections || {});
  }

  getProjectEvaluatedValues(): ConfigValues {
    const projectDetails = this.activeProject?.projectDetails;
    return projectDetails?.evaluatedValues || {};
  }

  get activeProject(): ProjectInterface | undefined {
    return this.projects.find((pj) => pj.id === this.activeProjectId);
  }
}
