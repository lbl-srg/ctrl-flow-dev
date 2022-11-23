import { v4 as uuid } from "uuid";
import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";
import RootStore from "./index";

import { ConfigValues } from "../utils/modifier-helpers";

export interface SelectionInterface {
  name: string;
  value: string;
}

export interface ConfigInterface {
  id: string;
  name?: string;
  isLocked: boolean;
  selections?: ConfigValues;
  evaluatedValues?: ConfigValues;
  quantity?: number;
  systemPath: string;
  templatePath: string;
  [key: string]: string | number | undefined | boolean | ConfigValues;
}

export type ConfigProps = Omit<ConfigInterface, "id">;

export default class Config {
  configs: ConfigInterface[] = [];
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this);

    makePersistable(this, {
      name: this.rootStore.getStorageKey("config"),
      properties: ["configs"],
    });
  }

  add(config: ConfigProps) {
    const merged = {
      id: uuid(),
      name: "Default",
      isLocked: false,
      selections: {},
      evaluatedValues: {},
      quantity: 1,

      ...config,
    } as ConfigInterface;

    this.configs.push(merged);
  }

  update(id: string, attrs: Partial<ConfigInterface>) {
    const config = this.getById(id);
    if (config)
      Object.entries(attrs).forEach(([key, value]) => (config[key] = value));
  }

  getById(id: string | null | undefined): ConfigInterface | undefined {
    return this.configs.find((config) => config.id === id);
  }

  remove(id: string | undefined) {
    this.configs = this.configs.filter((config) => config.id !== id);
  }

  toggleConfigLock(id: string | undefined) {
    const config = this.getById(id);
    if (config) config.isLocked = !config.isLocked;
  }

  hasSystemTemplateConfigs(systemPath: string, templatePath: string): boolean {
    return this.configs.find(
      (config) =>
        config.systemPath == systemPath && config.templatePath === templatePath,
    )
      ? true
      : false;
  }

  // Look in the config for the value of the first option that matches a given modelicaPath
  // findOptionValue(configId: string, optionPath: string): string | undefined {
  //   const config = this.getById(configId);
  //   if (!config?.selections) return undefined;

  //   return config.selections.find((selection) => selection.name === optionPath)
  //     ?.value;
  // }

  setSelections(configId: string, selections: ConfigValues) {
    const config = this.getById(configId);
    if (config) config.selections = selections;
  }

  setEvaluatedValues(configId: string, evaluatedValues: ConfigValues) {
    const config = this.getById(configId);
    if (config) config.evaluatedValues = evaluatedValues;
  }

  getConfigSelections(configId: string | undefined): any {
    const config = this.getById(configId);
    return config?.selections;
  }

  getConfigEvaluatedValues(configId: string | undefined): any {
    const config = this.getById(configId);
    return config?.evaluatedValues;
  }

  getActiveConfigs(): ConfigInterface[] {
    const system = this.rootStore.uiStore.activeSystemPath;
    const template = this.rootStore.uiStore.activeTemplatePath;
    return this.getConfigsForSystemTemplate(system, template);
  }

  getConfigsForSystemTemplate(
    systemPath: string | null,
    templatePath: string | null,
  ): ConfigInterface[] {
    return this.configs.filter(
      (config) =>
        config.systemPath === systemPath &&
        config.templatePath === templatePath,
    );
  }

  removeAllForSystemTemplate(systemPath: string, templatePath: string) {
    this.configs = this.configs.filter((config) =>
      config.systemPath === systemPath && config.templatePath === templatePath
        ? false
        : true,
    );
  }
}
