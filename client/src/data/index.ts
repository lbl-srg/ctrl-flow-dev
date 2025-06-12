import npmPkg from "../../package.json";
import { useContext, createContext } from "react";
import {
  TemplateInterface,
  TemplateDataInterface,
  OptionInterface,
  SystemTypeInterface,
} from "./types";
import UiStore from "./ui";
import TemplateStore from "./template";
import ProjectStore from "./project";
import ConfigStore from "./config";
import { configurePersistable } from "mobx-persist-store";
import tplData from "./templates.json";

// export interface RootStoreInterface {
//   storageKey: string;
//   uiStore: any;
//   templateStore: any;
//   projectStore: any;
//   configStore: any;
//   getStorageKey: (suffix: string) => string;
// }

// setup config for saving to localStorage
configurePersistable(
  {
    storage: window.localStorage,
    stringify: true,
    debugMode: false,
  },
  { delay: 200, fireImmediately: false },
);

class RootStore {
  storageKey = `lbl-storage-v${npmPkg.version}`;
  uiStore: UiStore;
  templateStore: TemplateStore;
  projectStore: ProjectStore;
  configStore: ConfigStore;

  constructor(templateData: TemplateDataInterface) {
    this.uiStore = new UiStore(this);
    this.templateStore = new TemplateStore(this, templateData);
    this.projectStore = new ProjectStore(this);
    this.configStore = new ConfigStore(this);
  }

  getStorageKey(suffix = ""): string {
    return `${this.storageKey}-${suffix}`;
  }
}

const StoresContext = createContext(new RootStore(tplData));

// this will be the function available for the app to connect to the stores
export const useStores = () => useContext(StoresContext);
export default RootStore;
