import { v4 as uuid } from "uuid";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

/*
const config = {
  sytemPath: "",
  templatePath: "",
  id: "",
  name: "",
  isLocked: false,
  selections: [],
  quantity: 1
}
*/

export default class Config {
  configs = [];

  constructor(rootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this);

    makePersistable(this, {
      name: this.rootStore.getStorageKey("config"),
      properties: ["configs"],
    });
  }

  add(config) {
    const merged = {
      id: uuid(),
      name: "Default",
      isLocked: false,
      selections: [],
      quantity: 1,
      ...config,
    };

    this.configs.push(merged);
  }

  update(attrs) {
    const config = this.getById(attrs.id);
    if (config) {
      Object.entries(attrs).forEach(([key, value]) => {
        if (key in config) config[key] = value;
      });
    }
  }

  getById(id) {
    return this.configs.find((config) => config.id === id);
  }

  remove(id) {
    this.configs = this.configs.filter((config) => config.id !== id);
  }

  toggleConfigLock(id) {
    const config = this.getById(id);
    if (config) config.isLocked = !config.isLocked;
  }

  hasSystemTemplateConfigs(systemPath, templatePath) {
    return this.configs.find(
      (config) =>
        config.systemPath == systemPath && config.templatePath === templatePath,
    )
      ? true
      : false;
  }

  getConfigsForSystemTemplate(systemPath, templatePath) {
    return this.configs.filter(
      (config) =>
        config.systemPath === systemPath &&
        config.templatePath === templatePath,
    );
  }

  removeAllForSystemTemplate(systemPath, templatePath) {
    this.configs = this.configs.filter((config) =>
      config.systemPath === systemPath && config.templatePath === templatePath
        ? false
        : true,
    );
  }
}
