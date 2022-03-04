import {
    useStore,
    Option,
    Selection,
    SystemTemplate
} from "../store/store";

jest.mock('./mock-data');

test("Adding and Removing a Configuration", () => {
    const testName = "test";
    const [template, ...templates] = useStore.getState().getTemplates();
    useStore.getState().addConfig(template, {name: testName});

    let [config, ...rest] = useStore.getState().getConfigs();
    const [projectConfig, ...others] = useStore.getState().getActiveProject().configs;

    expect(config.name).toEqual(testName);
    expect(projectConfig).toEqual(config);

    useStore.getState().removeConfig(projectConfig);

    expect(useStore.getState().configurations.length).toBe(0);
    expect(useStore.getState().getActiveProject().configs.length).toBe(0);

    // test passing config properties on create
    useStore.getState().addConfig(template, {name: testName});
    [config, ...rest] = useStore.getState().getConfigs();
    expect(config.name).toEqual(testName);
});

test("Adding configs adds active system templates", () => {
    const [template1, template2, ...templates] = useStore.getState().getTemplates();
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

test("Template/Option Denormalization", () => {
    const [templateN, ...templatesN] = useStore.getState().templates;
    const template = useStore.getState().getTemplates().find(t => t.id === templateN.id) as SystemTemplate;
    const [_, options] = useStore.getState().getTemplateOptions(template);

    expect(template).not.toBe(null || undefined);
    expect(templateN.id === template.id);
    const templateOptions = template.options as Option[];

    templateOptions.map(o => {
        expect(o).toEqual(options.find(option => option.id === o.id));
    });
});

// NOTE: a reduced data set is being used to test option selection
// test("Test Setting Config Name", () => {
//     const testName = "ConfigTestName";
//     const options = useStore.getState().getOptions();
//     expect(options.length).toBe(7);
//     const [template1, templates] = useStore.getState().getTemplates();

//     useStore.getState().addConfig(template1);

//     let[config, ...rest] = useStore.getState().getConfigs();
//     useStore.getState().updateConfig(config, testName, config.selections);
//     [config, ...rest] = useStore.getState().getConfigs();

//     expect(config.name).toEqual(testName);
// });

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
    expect(options.length).toBe(7);
    const [template1, templates] = useStore.getState().getTemplates();

    useStore.getState().addConfig(template1);

    // a map to help make option access a little easier:
    const optionMap = options.reduce((previousValue: {[key: number]: Option}, currentValue: Option) => {
        previousValue[currentValue.id] = currentValue;
        return previousValue;
    }, {})

    // refer to mock data in __mocks__ folder for tree of available options
    const selections: Selection[] = [
        {parent: optionMap[1], option: optionMap[2], value: undefined},
        {parent: optionMap[2], option: optionMap[3], value: undefined}
    ]

    let[config, ...rest] = useStore.getState().getConfigs();
    useStore.getState().updateConfig(config, testName, selections);
    [config, ...rest] = useStore.getState().getConfigs();

    expect(config.name).toEqual(testName);
    expect(config.selections).toEqual(selections);

});

test("Test Config Selection Pruning", () => {
    const testName = "ConfigTestName";
    const options = useStore.getState().getOptions();
    expect(options.length).toBe(7);
    const [template1, templates] = useStore.getState().getTemplates();

    useStore.getState().addConfig(template1);

    // a map to help make option access a little easier:
    const optionMap = options.reduce((previousValue: {[key: number]: Option}, currentValue: Option) => {
        previousValue[currentValue.id] = currentValue;
        return previousValue;
    }, {})

    let[config, ...rest] = useStore.getState().getConfigs();

    // refer to mock data in __mocks__ folder for tree of available options
    const selections: Selection[] = [
        {parent: optionMap[1], option: optionMap[2], value: undefined},
        {parent: optionMap[2], option: optionMap[3], value: undefined}
    ]
    useStore.getState().updateConfig(config, testName, selections);

    // check that on selection of a different branch prunes out previous selctions
    const newSelections: Selection[] = [
        {parent: optionMap[1], option: optionMap[5], value: undefined}
    ];
    useStore.getState().updateConfig(config, testName, newSelections);
    [config, ...rest] = useStore.getState().getConfigs();
    expect(config.selections).toEqual(newSelections);

    const addChildSelection: Selection[] = [
        {parent: optionMap[5], option: optionMap[6], value: undefined}
    ];
    useStore.getState().updateConfig(config, testName, addChildSelection);
    [config, ...rest] = useStore.getState().getConfigs();
    // expect both selections (because both are on the same branch of options)
    expect(config.selections).toEqual([...newSelections, ...addChildSelection]);
});
