import { makeAutoObservable, autorun } from "mobx";
import persist from "./persist";

const { ui } = persist.storage;
const MIN_WIDTH = 100;

export default class Ui {
  activeSystemPath = null;
  openSystemPath = null;
  activeTemplatePath = null;
  activeConfigId = null;

  leftColWidth = ui?.leftColWidth || 300;
  watchScroll = false;

  constructor(rootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this);

    autorun(() => {
      persist.storage = { ui: { leftColWidth: this.leftColWidth } };
    });
  }

  // actions
  clearNavState() {
    this.activeSystem = this.activeTemplatePath = this.activeConfigPath = null;
  }

  toggleSystemOpenPath(path) {
    if (this.openSystemPath === path) this.openSystemPath = null;
    else this.openSystemPath = path;
  }

  setActiveSystemPath(path) {
    this.clearNavState();
    this.activeSystemPath = path;
    this.timeoutScroll();
  }

  setActiveConfigId(id) {
    this.activeConfigId = id;
  }

  setActiveTemplatePath(path) {
    this.activeTemplatePath = path;
  }

  setLeftColWidth(width) {
    this.leftColWidth = width > MIN_WIDTH ? width : MIN_WIDTH;
  }

  timeoutScroll() {
    this.watchScroll = false;

    setTimeout(() => {
      this.watchScroll = true;
    }, 1000);
  }
}
