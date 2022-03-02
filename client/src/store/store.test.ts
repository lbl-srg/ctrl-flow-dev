import {
    useStore,
    Option,
    Selection,
    SystemTemplate
} from "../store/store";

test("Test denormalization", () => {
    const [templateN, ...templatesN] = useStore.getState().templates;
    const template = useStore.getState().getTemplates().find(t => t.id === templateN.id) as SystemTemplate;
    const [_, options] = useStore.getState().getTemplateOptions(template);

    expect(template).not.toBe(null || undefined);
    expect(templateN.id === template.id);
    const templateOptions = template.options as Option[];
    console.log(templateOptions);
    templateOptions.map(o => {
        expect(o).toEqual(options.find(option => option.id === o.id));
    });
});
