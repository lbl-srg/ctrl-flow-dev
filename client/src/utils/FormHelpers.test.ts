import {
    useStore,
    Option
} from "../store/store";

import {
    OptionRelation,
    ConfigFormValues,
    getInitialFormValues,
    getSelections
} from "./FormHelpers";

beforeEach(() => {
    const [system, ...rest] = useStore.getState().templates.systems;
    useStore.getState().addConfig(system);
});

test("getInitialFormValues: New Config should not have any options specified", () => {
    const [config, ...otherConfigs] = useStore.getState().userProjects.configurations;
    const selections = config.selections as Option[];

    expect(selections.length).toEqual(0);
    expect(config.name).not.toBe(null);
});

test("getSelections: Option change should remove unrelated child branches", () => {
    const configs = useStore.getState().userProjects.configurations;
    expect(configs.length === 0);
    // TODO
});
