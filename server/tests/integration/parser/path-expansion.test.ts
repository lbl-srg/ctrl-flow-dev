import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { loadPackage, getOptions } from "../../../src/parser/";
import { evaluateExpression } from "../../../src/parser/expression";

describe("Path Expansion", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
  });

  it("Parameter type paths are expanded", () => {
    const { options } = getOptions();

    const expectedType = "TestPackage.Component.FourthComponent";
    const shortPathComponent = options.find(
      (o) =>
        o.modelicaPath ===
        "TestPackage.Template.TestTemplate.short_path_component",
    );
    expect(shortPathComponent?.type).toEqual(expectedType);
  });

  it("'Choice' types are expanded", () => {
    const { options } = getOptions();
    const expectedRootPackage = "TestPackage";
    const shortChoices = options.find(
      (o) =>
        o.modelicaPath ===
        "TestPackage.Template.TestTemplate.selectable_component_with_relative_paths",
    );

    const childOptions = shortChoices?.options;
    childOptions?.map((o) =>
      expect(o.startsWith(expectedRootPackage)).toBeTruthy(),
    );
  });

  it("Constrain modifier types are expanded", () => {
    const { options } = getOptions();
    const expectedRootPackage = "TestPackage";
    const modPath = "TestPackage.Interface.PartialComponent.container";
    const shortModOption = options.find(
      (o) =>
        o.modelicaPath ===
        "TestPackage.Template.TestTemplate.selectable_component_with_relative_paths",
    );

    const mods = shortModOption?.modifiers;
    expect(mods).toBeDefined();
    if (mods) {
      expect(mods[modPath]).toBeDefined();
    }
  });

  it("Redeclare value paths are expanded", () => {
    // const { options } = getOptions();
    // const expectedValue = "TestPackage.Component.ThirdComponent";
    // const shortPathComponent = options.find(
    //   (o) =>
    //     o.modelicaPath ==="TestPackage.Template.TestTemplate.short_path_component",
    // );
    // const mod =
    //   shortPathComponent?.modifiers[
    //     "TestPackage.Component.FourthComponent.replaceable_param"
    //   ];
    // expect(mod).toBeDefined();
    // if (mod) {
    //   expect(evaluateExpression(mod.expression)).toBe(expectedValue);
    // }
  });
});
