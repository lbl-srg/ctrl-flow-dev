import { useContext, createContext } from "react";
import UiStore from "./ui";
import TemplateStore from "./template";

class RootStore {
  constructor() {
    this.uiStore = new UiStore(this);
    this.templateStore = new TemplateStore(this);
  }
}

const StoresContext = createContext(new RootStore());

// this will be the function available for the app to connect to the stores
export const useStores = () => useContext(StoresContext);
