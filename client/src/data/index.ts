import npmPkg from "../../package.json";
import { useContext, createContext } from "react";
import { TemplateDataInterface } from "./types";
import UiStore from "./ui";
import TemplateStore from "./template";
import ProjectStore from "./project";
import ConfigStore from "./config";
import { makeAutoObservable } from "mobx";
import {
  configurePersistable,
  makePersistable,
  PersistenceStorageOptions,
} from "mobx-persist-store";
import tplData from "./templates.json";

const ROOT_STORAGE_KEY = `lbl-storage`;
export const getStorageKey = (suffix: string, version?: string) =>
  version
    ? `${ROOT_STORAGE_KEY}-v${version}-${suffix}`
    : `${ROOT_STORAGE_KEY}-${suffix}`;

/**
 * Adds mobx integration, writing object state to browser local storage
 */
function makePersistent<T extends object>(
  instance: T,
  opts: PersistenceStorageOptions<T, keyof T>,
) {
  makeAutoObservable(instance);
  makePersistable(instance, opts);

  return instance;
}

configurePersistable(
  {
    storage: window.localStorage,
    stringify: true,
    debugMode: false,
  },
  { delay: 200, fireImmediately: false },
);

type StoreOptions = {
  persist: boolean; // store in local storage
  version?: string;
};

class RootStore {
  uiStore: UiStore;
  templateStore: TemplateStore;
  projectStore: ProjectStore;
  configStore: ConfigStore;

  constructor(templateData: TemplateDataInterface, options?: StoreOptions) {
    const projectStore = new ProjectStore(this);
    const configStore = new ConfigStore(this);
    this.uiStore = new UiStore(this);
    this.templateStore = new TemplateStore(this, templateData);
    this.projectStore = options?.persist
      ? makePersistent(projectStore, {
          name: getStorageKey("projects", options.version),
          properties: ["projects", "activeProjectId"],
        })
      : projectStore;
    this.configStore = options?.persist
      ? makePersistent(configStore, {
          name: getStorageKey("configs", options.version),
          properties: ["configs"],
        })
      : configStore;
    this.uiStore = options?.persist
      ? makePersistent(this.uiStore, {
          name: getStorageKey("ui", options.version),
          properties: ["leftColWidth"],
        })
      : this.uiStore;
  }

  getTemplate(path: string) {
    return this.templateStore.getTemplateByPath(path);
  }

  getTemplates() {
    return this.templateStore.getAllOptions();
  }

  getTemplateNodes() {
    return this.templateStore.getAllOptions();
  }
}

const StoresContext = createContext(
  new RootStore(tplData, { persist: true, version: npmPkg.version }),
);

// this will be the function available for the app to connect to the stores
export const useStores = () => useContext(StoresContext);
export default RootStore;
