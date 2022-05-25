import { poj } from "../utils/utils";
import { v4 as uuid } from "uuid";

export default class Config {
  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  addUserConfig(systemPath, templatePath, config) {
    const existing = this.getUserSystemByPath(systemPath);

    const userConfig = {
      ...config,
      id: uuid(),
      name: "Default",
      templatePath,
      isLocked: false,
      selections: [],
    };

    if (existing) {
      existing.userConfigs.push(userConfig);
    } else {
      this.rootStore.projectStore.activeProject.userSystems.push({
        modelicaPath: systemPath,
        userConfigs: [userConfig],
      });
    }
  }

  getUserSystemByPath(path) {
    return this.rootStore.projectStore.activeProject.userSystems.find(
      (sys) => sys.modelicaPath === path,
    );
  }

  removeAllConfigsForTemplate(systemPath, templatePath) {
    const match = this.getUserSystemByPath(systemPath);
    if (!match) return;

    match.userConfigs = match.userConfigs.filter(
      (config) => config.templatePath !== templatePath,
    );
  }
}
