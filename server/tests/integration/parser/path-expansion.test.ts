import { initializeTestModelicaJson } from "./utils";
import { loadPackage, getOptions } from "../../../src/parser/";
import { evaluateExpression } from "../../../src/parser/expression";

/**
 * This set of tests is attempting to cover all places a 'type' is assigned, checking
 * that the type is properly expanded to a full path and not kept as a relative path.
 */

describe("Path Expansion", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    loadPackage('TestPackage');
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

  it("Redeclare modifier paths are expanded", () => {
    const { options } = getOptions();
    const expectedValue = "TestPackage.Component.FifthComponent";
    const shortPathComponent = options.find(
      (o) =>
        o.modelicaPath ===
        "TestPackage.Template.TestTemplate.short_path_component",
    );
    const mod =
      shortPathComponent?.modifiers[
        "TestPackage.Component.FourthComponent.replaceable_param"
      ];
    expect(mod).toBeDefined();
    if (mod) {
      // For redeclare modifications: 'redeclare' stores the type, 'expression' is only set if there's a binding (=)
      expect(mod.redeclare).toBe(expectedValue);
    }
  });

  it("Default redeclare type is assigned as expected", () => {
    const { options } = getOptions();
    const expectedType = "TestPackage.Component.SecondComponent";
    const replaceableComponent = options.find(
      (o) =>
        o.modelicaPath ===
        "TestPackage.Template.TestTemplate.selectable_component_with_relative_paths",
    );

    // For replaceable components: 'type' stores the declared type, 'value' is undefined if no binding
    expect(replaceableComponent?.type).toBe(expectedType);
    expect(replaceableComponent?.value).toBeUndefined();
  });
});
