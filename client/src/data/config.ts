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
  projectId: string;
  name?: string;
  isLocked: boolean;
  selections?: ConfigValues;
  evaluatedValues?: ConfigValues;
  quantity?: number;
  systemPath: string;
  templatePath: string;
  [key: string]: string | number | undefined | boolean | ConfigValues;
}

export type ConfigProps = Omit<ConfigInterface, "id" | "projectId">;

export default class Config {
  configs: ConfigInterface[] = [];
  rootStore: RootStore;
  /** Resolves once the store is loaded from local storage */
  hydrated: Promise<unknown> = Promise.resolve();

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeAutoObservable(this, { hydrated: false });

    if (process.env.NODE_ENV !== "test") {
      this.hydrated = makePersistable(this, {
        name: this.rootStore.getStorageKey("config"),
        properties: ["configs"],
      });
    }
  }

  /**
   * Adds a configuration to the active project
   */
  add(config: ConfigProps) {
    const merged = {
      id: uuid(),
      projectId: this.activeProjectId,
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

  hasSystemTemplateConfigs(
    systemPath: string,
    templatePath: string,
    projectId = this.activeProjectId,
  ): boolean {
    return (
      this.getConfigsForSystemTemplate(systemPath, templatePath, projectId)
        .length > 0
    );
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
    projectId = this.activeProjectId,
  ): ConfigInterface[] {
    return this.configs.filter(
      (config) =>
        config.projectId === projectId &&
        config.systemPath === systemPath &&
        config.templatePath === templatePath,
    );
  }

  getConfigsForProject(projectId = this.activeProjectId): ConfigInterface[] {
    return toJS(
      this.configs.filter((config) => config.projectId === projectId),
    );
  }

  removeAllForSystemTemplate(
    systemPath: string,
    templatePath: string,
    projectId = this.activeProjectId,
  ) {
    this.configs = this.configs.filter(
      (config) =>
        !(
          config.projectId === projectId &&
          config.systemPath === systemPath &&
          config.templatePath === templatePath
        ),
    );
  }

  removeAllForProject(projectId: string) {
    this.configs = this.configs.filter(
      (config) => config.projectId !== projectId,
    );
  }

  /**
   * Attaches the configurations that belong to no existing project (stored
   * before configurations were linked to projects, or whose project was not
   * saved) to the project, if there is exactly one. Otherwise, reports them:
   * configurations are never dropped.
   */
  attachOrphans(projectIds: string[]) {
    const orphans = this.configs.filter(
      (config) => !projectIds.includes(config.projectId),
    );
    if (orphans.length === 0) return;
    if (projectIds.length === 1) {
      orphans.forEach((config) => (config.projectId = projectIds[0]));
    } else {
      console.error(
        `${orphans.length} configuration(s) belong to no project`,
        orphans.map((config) => config.id),
      );
    }
  }

  private get activeProjectId(): string {
    return this.rootStore.projectStore.activeProjectId;
  }
}
