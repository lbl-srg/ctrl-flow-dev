import {
    useStore,
    Option,
    Selection,
    SystemTemplate
} from "../store/store";

test("Denormalization", () => {
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

// TODO: expand this once actually switching between projects
test("Active Project defaults to 1", () => { 
    const project = useStore.getState().getActiveProject();

    expect(project.id).toEqual(1);
});

test("Adding and Removing a Configuration", () => {
    const [template, ...templates] = useStore.getState().getTemplates();
    useStore.getState().addConfig(template, {name: "test"});

    const [config, ...rest] = useStore.getState().getConfigs();
    const [projectConfig, ...others] = useStore.getState().getActiveProject().configs;

    expect(projectConfig).toEqual(config);

    useStore.getState().removeConfig(projectConfig);

    expect(useStore.getState().configurations.length).toBe(0);
    expect(useStore.getState().getActiveProject().configs.length).toBe(0);
});
