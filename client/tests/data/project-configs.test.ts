/**
 * Configurations belong to a project (docs/selection-keys.md, "Stores")
 */
import { stopPersisting } from "mobx-persist-store";
import RootStore from "../../src/data";
import { ConfigInterface } from "../../src/data/config";
import { ProjectInterface } from "../../src/data/project";

const SYSTEM = "Buildings.Templates.ZoneEquipment";
const RH = "Buildings.Templates.ZoneEquipment.VAVBoxReheat";
const CO = "Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly";

const addProject = (store: RootStore, id: string) => {
  const project = {
    ...store.projectStore.projects[0],
    id,
  } as ProjectInterface;
  store.projectStore.projects.push(project);
  return project;
};

/**
 * Store with configurations in two projects: "rh" and "co" in the default
 * project, "other" in project "p2", which is left active
 */
function twoProjects() {
  const store = new RootStore();
  const { configStore, projectStore } = store;
  const defaultId = projectStore.activeProjectId;
  configStore.add({ systemPath: SYSTEM, templatePath: RH, name: "rh" });
  configStore.add({ systemPath: SYSTEM, templatePath: CO, name: "co" });
  addProject(store, "p2");
  projectStore.setActiveProjectId("p2");
  configStore.add({ systemPath: SYSTEM, templatePath: RH, name: "other" });
  return { store, configStore, projectStore, defaultId };
}

const names = (configs: { name?: string }[]) => configs.map((c) => c.name);

describe("Configurations linked to projects", () => {
  it("adds configurations to the active project", () => {
    const { configStore, defaultId } = twoProjects();
    expect(configStore.configs.map((c) => [c.name, c.projectId])).toEqual([
      ["rh", defaultId],
      ["co", defaultId],
      ["other", "p2"],
    ]);
  });

  it("scopes queries to the active project by default", () => {
    const { configStore, defaultId } = twoProjects();
    expect(names(configStore.getConfigsForProject())).toEqual(["other"]);
    expect(names(configStore.getConfigsForProject(defaultId))).toEqual([
      "rh",
      "co",
    ]);
    expect(names(configStore.getConfigsForSystemTemplate(SYSTEM, RH))).toEqual([
      "other",
    ]);
    expect(
      names(configStore.getConfigsForSystemTemplate(SYSTEM, RH, defaultId)),
    ).toEqual(["rh"]);
    expect(configStore.hasSystemTemplateConfigs(SYSTEM, RH)).toBe(true);
    expect(configStore.hasSystemTemplateConfigs(SYSTEM, CO)).toBe(false);
    expect(configStore.hasSystemTemplateConfigs(SYSTEM, CO, defaultId)).toBe(
      true,
    );
  });

  it("scopes removals to a project", () => {
    const { configStore, defaultId } = twoProjects();
    configStore.removeAllForSystemTemplate(SYSTEM, RH);
    expect(names(configStore.configs)).toEqual(["rh", "co"]);
    configStore.removeAllForProject(defaultId);
    expect(configStore.configs).toEqual([]);
  });

  it("does not share the default project between stores", () => {
    const a = new RootStore();
    const b = new RootStore();
    expect(a.projectStore.activeProjectId).not.toEqual(
      b.projectStore.activeProjectId,
    );
    expect(a.projectStore.projects[0]).not.toBe(b.projectStore.projects[0]);
  });

  describe("attachOrphans", () => {
    it("attaches orphans to the project if there is only one", () => {
      const store = new RootStore();
      const { configStore, projectStore } = store;
      configStore.add({ systemPath: SYSTEM, templatePath: RH, name: "a" });
      delete (configStore.configs[0] as Partial<ConfigInterface>).projectId; // stored before #634
      configStore.add({ systemPath: SYSTEM, templatePath: RH, name: "b" });
      configStore.configs[1].projectId = "deleted"; // project not saved
      configStore.attachOrphans([projectStore.activeProjectId]);
      expect(configStore.configs.map((c) => c.projectId)).toEqual([
        projectStore.activeProjectId,
        projectStore.activeProjectId,
      ]);
    });

    it("reports orphans and keeps them if there are several projects", () => {
      const { configStore, projectStore, defaultId } = twoProjects();
      configStore.configs[0].projectId = "deleted";
      const error = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      configStore.attachOrphans(projectStore.projects.map((p) => p.id));
      expect(error).toHaveBeenCalledTimes(1);
      error.mockRestore();
      expect(configStore.configs.map((c) => c.projectId)).toEqual([
        "deleted",
        defaultId,
        "p2",
      ]);
    });
  });
});

describe("Persistence of projects and configurations", () => {
  const storage = new Map<string, string>();
  const nodeEnv = process.env.NODE_ENV;
  const SAVE_DELAY = 300; // persistence is debounced by 200 ms

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let loaded: RootStore | undefined;

  /** Store loaded from local storage, as on page load (closing the page of the previous one) */
  async function load() {
    unload();
    const store = new RootStore();
    loaded = store;
    await Promise.all([
      store.projectStore.hydrated,
      store.configStore.hydrated,
    ]);
    return store;
  }

  beforeAll(() => {
    const localStorage = window.localStorage as jest.Mocked<Storage>;
    localStorage.getItem.mockImplementation((k) => storage.get(k) ?? null);
    localStorage.setItem.mockImplementation((k, v) => {
      storage.set(k, v);
    });
    process.env.NODE_ENV = "development"; // persistence is off in tests
  });

  afterAll(() => {
    process.env.NODE_ENV = nodeEnv;
    const localStorage = window.localStorage as jest.Mocked<Storage>;
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
  });

  function unload() {
    if (!loaded) return;
    stopPersisting(loaded.projectStore);
    stopPersisting(loaded.configStore);
    stopPersisting(loaded.uiStore);
    loaded = undefined;
  }

  beforeEach(() => storage.clear());
  afterEach(unload);

  it("keeps configurations in their project across reloads", async () => {
    const first = await load();
    const projectId = first.projectStore.activeProjectId;
    first.configStore.add({ systemPath: SYSTEM, templatePath: RH });
    await wait(SAVE_DELAY);

    // The default project was saved although it was never modified
    const second = await load();
    expect(second.projectStore.activeProjectId).toEqual(projectId);
    expect(second.configStore.getConfigsForProject()).toHaveLength(1);
  });

  it("attaches configurations stored without a project", async () => {
    const first = await load();
    first.configStore.add({ systemPath: SYSTEM, templatePath: RH });
    delete (first.configStore.configs[0] as Partial<ConfigInterface>).projectId;
    await wait(SAVE_DELAY);
    // Projects not stored, as before #634
    storage.forEach((_, k) => k.endsWith("-projects") && storage.delete(k));

    const second = await load();
    await wait(0); // orphans are attached once both stores are hydrated
    expect(second.configStore.getConfigsForProject()).toHaveLength(1);
  });
});
