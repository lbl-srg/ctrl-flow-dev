import { useStore, Option, Selection, SystemTemplate } from "../store/store";

test("Denormalization", () => {
  const [templateN, ...templatesN] = useStore.getState().templates;
  const template = useStore
    .getState()
    .getTemplates()
    .find((t) => t.id === templateN.id) as SystemTemplate;
  const [_, options] = useStore.getState().getTemplateOptions(template);

  expect(template).not.toBe(null || undefined);
  expect(templateN.id === template.id);
  const templateOptions = template.options as Option[];

  templateOptions.map((o) => {
    expect(o).toEqual(options.find((option) => option.id === o.id));
  });
});

test("Adding and Removing a Configuration", () => {
  const testName = "test";
  const [template, ...templates] = useStore.getState().getTemplates();
  useStore.getState().addConfig(template, { name: testName });

  const [config, ...rest] = useStore.getState().getConfigs();
  const [projectConfig, ...others] = useStore
    .getState()
    .getActiveProject().configs;

  expect(config.name).toEqual(testName);
  expect(projectConfig).toEqual(config);

  useStore.getState().removeConfig(projectConfig);

  expect(useStore.getState().configurations.length).toBe(0);
  expect(useStore.getState().getActiveProject().configs.length).toBe(0);
});

test("Adding configs adds active system templates", () => {
  const [template1, template2, ...templates] = useStore
    .getState()
    .getTemplates();
  useStore.getState().addConfig(template1);
  useStore.getState().addConfig(template2);
  const activeTemplates = useStore.getState().getActiveTemplates();

  expect(activeTemplates.length).toEqual(2);
});

// TODO: expand this once we are actually switching between projects
test("Active Project defaults to 1", () => {
  const project = useStore.getState().getActiveProject();

  expect(project.id).toEqual(1);
});

// TODO: get a mock option tree for testing in place then add testing
// around selection pruning
