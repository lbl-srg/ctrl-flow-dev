import { useStore, Option, Selection } from "../store/store";

import {
  OptionRelation,
  ConfigFormValues,
  getInitialFormValues,
  getSelections,
} from "./FormHelpers";

beforeEach(() => {
  const [template, ...rest] = useStore.getState().getTemplates();
  useStore.getState().addConfig(template);
});

test("getInitialFormValues: New Config should not have any options specified", () => {
  const [config, ...otherConfigs] = useStore.getState().getConfigs();
  const selections = config.selections as Selection[];

  expect(selections.length).toEqual(0);
  expect(config.name).not.toBe(null);
});

test("getSelections: Option change should remove unrelated child branches", () => {
  const configs = useStore.getState().configurations;
  expect(configs.length === 0);
  // TODO
});
