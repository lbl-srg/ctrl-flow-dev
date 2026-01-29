import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { TemplateInterface } from "./template";
import RootStore from ".";
import { ConfigInterface } from "./config";

const MIN_WIDTH = 100;

export default class Ui {
  activeSystemPath: string | null = null;
  openSystemPath: string | null = null;
  activeTemplatePath: string | null = null;
  activeConfigId: string | null | undefined = null;
  leftColWidth = 300;
  watchScroll = false;
  rootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this);

    if (process.env.NODE_ENV !== "test") {
      makePersistable(this, {
        name: this.rootStore.getStorageKey("ui"),
        properties: ["leftColWidth"],
      });
    }
  }

  // actions
  clearNavState() {
    this.activeSystemPath =
      this.activeTemplatePath =
      this.activeConfigId =
        null;
  }

  get activeTemplate(): TemplateInterface | undefined {
    return this.rootStore.templateStore.getTemplateByPath(
      this.activeTemplatePath,
    );
  }

  get activeConfig(): ConfigInterface | undefined {
    return this.rootStore.configStore.getById(this.activeConfigId);
  }

  toggleSystemOpenPath(path: string) {
    if (this.openSystemPath === path) this.openSystemPath = null;
    else this.openSystemPath = path;
  }

  setOpenSystemPath(path: string) {
    this.openSystemPath = path;
  }

  setActiveSystemPath(path: string) {
    this.clearNavState();
    this.activeSystemPath = path;
    this.timeoutScroll();
  }

  setActiveConfigId(id: string | undefined) {
    this.activeConfigId = id;
  }

  setActiveTemplatePath(path: string) {
    this.activeTemplatePath = path;
  }

  setLeftColWidth(width: number) {
    this.leftColWidth = width > MIN_WIDTH ? width : MIN_WIDTH;
  }

  timeoutScroll() {
    this.watchScroll = false;

    setTimeout(() => {
      this.watchScroll = true;
    }, 1000);
  }
}
