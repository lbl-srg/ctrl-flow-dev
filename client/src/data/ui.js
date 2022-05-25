import { makeAutoObservable } from "mobx";

export default class Ui {
  activeSystem = null;
  openSystem = null;

  activeTemplate = null;

  activeConfigPath = null;
  leftColWidth = 300;
  watchScroll = false;

  constructor() {
    makeAutoObservable(this);
  }

  // actions

  clearNavState() {
    this.activeSystem = this.activeTemplate = this.activeConfigPath = null;
  }

  toggleSystemOpen(path) {
    if (this.openSystem === path) this.openSystem = null;
    else this.openSystem = path;
  }

  setActiveSystem(path) {
    this.clearNavState();
    this.activeSystem = path;
    this.timeoutScroll();
  }

  setActiveTemplate(path) {
    this.activeTemplate = path;
  }

  setLeftColWidth(width) {
    this.leftColWidth = width;
  }

  timeoutScroll() {
    this.watchScroll = false;

    setTimeout(() => {
      this.watchScroll = true;
    }, 1000);
  }
}
