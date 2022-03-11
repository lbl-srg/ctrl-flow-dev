import {
  useStore,
  Configuration,
  MetaConfiguration,
  Option,
  Selection,
  SystemTemplate,
} from "../store/store";

jest.mock("./mock-data");

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

  let [config, ...rest] = useStore.getState().getConfigs();
  const [projectConfig, ...others] = useStore
    .getState()
    .getActiveProject().configs;

  expect(config.name).toEqual(testName);
  expect(projectConfig).toEqual(config);

  useStore.getState().removeConfig(projectConfig);

  expect(useStore.getState().configurations.length).toBe(0);
  expect(useStore.getState().getActiveProject().configs.length).toBe(0);

  // test passing config properties on create
  useStore.getState().addConfig(template, { name: testName });
  [config, ...rest] = useStore.getState().getConfigs();
  expect(config.name).toEqual(testName);
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

test("Active templates are returned alphabetized by name", () => {
  const templates = useStore.getState().getTemplates();

  const [t1, t2, ..._rest] = templates;
  useStore.getState().addConfig(t1);
  useStore.getState().addConfig(t2);
  const activeTemplates = useStore.getState().getActiveTemplates();
  const alphabetizedNames = activeTemplates.map((t) => t.name).sort();
  expect(activeTemplates.map((t) => t.name)).toEqual(alphabetizedNames);

  const notSortedActiveTemplates = useStore.getState().getActiveTemplates(null);

  expect(activeTemplates.map((t) => t.name)).not.toEqual(
    notSortedActiveTemplates.map((t) => t.name),
  );
});

test("Template/Option Denormalization", () => {
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

test("Test Setting Config Name", () => {
  const testName = "ConfigTestName";
  const options = useStore.getState().getOptions();

  const [template1, templates] = useStore.getState().getTemplates();

  useStore.getState().addConfig(template1);

  let [config, ...rest] = useStore.getState().getConfigs();
  useStore.getState().updateConfig(config, testName, config.selections);
  [config, ...rest] = useStore.getState().getConfigs();

  expect(config.name).toEqual(testName);
});

/**
 * Note: a smaller set of mocked data is being used for config testing
 *
 * The tree of options available to select is:
 *
 *               1
 *             /    \
 *            2       5
 *           / \     / \
 *          3   4   6   7
 *
 */

test("Test Updating Config Selections", () => {
  const testName = "ConfigTestName";
  const options = useStore.getState().getOptions();

  const [template1, templates] = useStore.getState().getTemplates();

  useStore.getState().addConfig(template1);

  // a map to help make option access a little easier:
  const optionMap = options.reduce(
    (previousValue: { [key: number]: Option }, currentValue: Option) => {
      previousValue[currentValue.id] = currentValue;
      return previousValue;
    },
    {},
  );

  const selections: Selection[] = [
    { parent: optionMap[1], option: optionMap[2], value: undefined },
    { parent: optionMap[2], option: optionMap[3], value: undefined },
  ];

  let [config, ...rest] = useStore.getState().getConfigs();
  useStore.getState().updateConfig(config, testName, selections);
  [config, ...rest] = useStore.getState().getConfigs();

  expect(config.name).toEqual(testName);
  expect(config.selections).toEqual(selections);
});

test("Test Config Selection Pruning", () => {
  const testName = "ConfigTestName";
  const options = useStore.getState().getOptions();

  const [template1, templates] = useStore.getState().getTemplates();

  useStore.getState().addConfig(template1);

  // a map to help make option access a little easier:
  const optionMap = options.reduce(
    (previousValue: { [key: number]: Option }, currentValue: Option) => {
      previousValue[currentValue.id] = currentValue;
      return previousValue;
    },
    {},
  );

  let [config, ...rest] = useStore.getState().getConfigs();

  // refer to mock data in __mocks__ folder for tree of available options
  const selections: Selection[] = [
    { parent: optionMap[1], option: optionMap[2], value: undefined },
    { parent: optionMap[2], option: optionMap[3], value: undefined },
  ];
  useStore.getState().updateConfig(config, testName, selections);

  // check that on selection of a different branch prunes out previous selctions
  const newSelections: Selection[] = [
    { parent: optionMap[1], option: optionMap[5], value: undefined },
  ];
  useStore.getState().updateConfig(config, testName, newSelections);
  [config, ...rest] = useStore.getState().getConfigs();
  expect(config.selections).toEqual(newSelections);

  const addChildSelection: Selection[] = [
    { parent: optionMap[5], option: optionMap[6], value: undefined },
  ];
  useStore.getState().updateConfig(config, testName, addChildSelection);
  [config, ...rest] = useStore.getState().getConfigs();
  // expect both selections (because both are on the same branch of options)
  expect(config.selections).toEqual([...newSelections, ...addChildSelection]);
});

test("Use 'addUserSystems' to batch add user systems", () => {
  const prefix = "TEST";
  const start = 1;
  const quantity = 10;
  const [template1, templates] = useStore.getState().getTemplates();

  useStore.getState().addConfig(template1);

  let [config, ...rest] = useStore.getState().getConfigs();
  useStore.getState().addUserSystems(prefix, start, quantity, config);

  // check that 10 systems were added
  const allSystems = useStore.getState().getUserSystems();
  expect(allSystems.length).toBe(quantity);

  // check that tag, prefix, number, and config are as expected
  allSystems.forEach((s, i) => {
    expect(s.prefix).toEqual(prefix);
    expect(s.number).toEqual(start + i);
    expect(s.tag).toEqual(`${prefix} - ${start + i}`);
    expect(s.config).toEqual(config);
    expect(s.data).toEqual([]);
  });
});

test("Metaconfigs are correctly generated based on systems added", () => {
  const prefix = "TEST";
  const prefix2 = "TEST2";
  const start = 1;
  const quantity1 = 10;
  const quantity2 = 5;

  const [template1, template2, ...templates] = useStore
    .getState()
    .getTemplates();

  useStore.getState().addConfig(template1, { name: prefix });
  useStore.getState().addConfig(template2, { name: prefix2 });

  const [config1, config2, ..._rest] = useStore.getState().getConfigs();

  useStore.getState().addUserSystems(prefix, start, quantity1, config1);
  useStore.getState().addUserSystems(prefix2, start, quantity2, config2);
  useStore.getState().addUserSystems(prefix, start, quantity1, config1);

  const metaConfigs = useStore.getState().getMetaConfigs();
  expect(metaConfigs.length).toBe(2);

  const [metaConfig1, metaConfig2] = metaConfigs;

  expect(metaConfig1).toBeTruthy();
  expect(metaConfig2).toBeTruthy();

  expect(metaConfig1.quantity).toBe(quantity1 + quantity1);
  expect(metaConfig2.quantity).toBe(quantity2);

  expect(metaConfig1.config).toEqual(config1);
  expect(metaConfig2.config).toEqual(config2);
});
