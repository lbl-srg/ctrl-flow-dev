import { useContext, createContext } from "react";
import UiStore from "./ui";
import TemplateStore from "./template";
import ProjectStore from "./project";
import ConfigStore from "./config";
class RootStore {
  constructor() {
    this.uiStore = new UiStore(this);
    this.templateStore = new TemplateStore(this);
    this.projectStore = new ProjectStore(this);
    this.configStore = new ConfigStore(this);
  }
}

const StoresContext = createContext(new RootStore());

// this will be the function available for the app to connect to the stores
export const useStores = () => useContext(StoresContext);
