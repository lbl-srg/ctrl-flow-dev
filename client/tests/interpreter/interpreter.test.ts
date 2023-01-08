import RootStore from "../../src/data";
import { ConfigInterface } from "../../src/data/config";
import { TemplateInterface, OptionInterface } from "../../src/data/template";

import {
  applyPathModifiers,
  OperatorType,
  ConfigContext,
  resolveToValue,
  evaluate,
  instancePathToOption,
} from "../../src/interpreter/interpreter";

// initialize global test dependencies
const store = new RootStore();
store.configStore.add({ name: "test config" });
const allOptions: { [key: string]: OptionInterface } =
  store.templateStore.getAllOptions();
const allTemplates: { [key: string]: TemplateInterface } =
  store.templateStore.getAllTemplates();
const template: TemplateInterface =
  allTemplates["Buildings.Templates.AirHandlersFans.VAVMultiZone"];
const [config] = store.configStore.configs;

describe("Path Modifier tests", () => {
  it("Applies a path modifier", () => {
    const pathMods = {
      "lets.modify.this.path": "path",
    };
    const longPath = "lets.modify.this.path.changed";
    const modifiedPath = applyPathModifiers(longPath, pathMods);

    expect(modifiedPath).toBe("path.changed");
  });

  it("Correctly leaves paths along if not in the modifier", () => {
    const pathMods = {
      "test.an.inner.replacement": "inner.replacement",
    };
    const longPath = "test.an.unrelated.path";
    const modifiedPath = applyPathModifiers(longPath, pathMods);

    expect(modifiedPath).toBe(longPath);
  });
});

describe("Basic Context generation without selections", () => {
  it("Is able to construct a context", () => {
    const context = new ConfigContext(
      template as TemplateInterface,
      config as ConfigInterface,
      allOptions,
    );
  });
});

const buildExpression = (operator: OperatorType, operands: any[]) => {
  return { operator, operands };
};

const expressionContext = new ConfigContext(
  template as TemplateInterface,
  config as ConfigInterface,
  allOptions,
);

describe("Simple resolveToValue tests (no type resolving/evaluation)", () => {
  it("Handles numbers", () => {
    const expectedValue = 4;
    const value = resolveToValue(4);
    expect(value).toEqual(expectedValue);
  });

  it("Handles strings", () => {
    const expectedValue = "Check it out";
    const value = resolveToValue(expectedValue);
    expect(value).toEqual(expectedValue);
  });

  it("Handles booleans", () => {
    const expectedValue = false;
    const value = resolveToValue(expectedValue);
    expect(value).toEqual(expectedValue);
  });
});

describe("Test set", () => {
  it("Simple expression evaluation without use of context", () => {
    const expectedValue = 1;
    const simpleExpression = buildExpression("none", [expectedValue]);
    const value = evaluate(simpleExpression);
    expect(value).toEqual(expectedValue);
  });

  it("Handles < and <= and > and >=", () => {
    expect(evaluate(buildExpression("<", [5, 4]))).toBeFalsy();
    expect(evaluate(buildExpression("<", [4, 5]))).toBeTruthy();
    expect(evaluate(buildExpression(">", [1, 2]))).toBeFalsy();
    expect(evaluate(buildExpression(">", [2, 1]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [2, 2]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [3, 2]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [1, 2]))).toBeFalsy();
    expect(evaluate(buildExpression("<=", [2, 2]))).toBeTruthy();
    expect(evaluate(buildExpression("<=", [4, 5]))).toBeTruthy();
    expect(evaluate(buildExpression("<=", [5, 4]))).toBeFalsy();
  });

  it("Handles == and !=", () => {
    // TODO: fix casting issues with comparator stuff...
    expect(evaluate(buildExpression("==", [1, 1, 1, 1]))).toBeTruthy();
    expect(evaluate(buildExpression("==", [3]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "a"]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "c"]))).toBeFalsy();
    expect(evaluate(buildExpression("!=", [1, 1, 2]))).toBeTruthy();
    expect(evaluate(buildExpression("!=", [1]))).toBeFalsy();
  });

  it("Handles if/else if/else", () => {
    /** TODO */
  });
});

describe("Path and value resolution without selections and then with selections", () => {
  it("Maps an instance path to an option path", () => {
    const context = new ConfigContext(
      template as TemplateInterface,
      config as ConfigInterface,
      allOptions,
    );

    const optionPath = instancePathToOption("TAirRet.isDifPreSen", context);
    expect(optionPath).toEqual(
      "Buildings.Templates.Components.Interfaces.PartialSensor.isDifPreSen",
    );
  });

  it("Maps an instance path to an option path modified by in template redeclares", () => {});

  it("Maps an instance path to an option path modified by selections", () => {});

  /**
   * This is a test of the simplist values to get, parameters at
   * the root of a template that are assigned a literal. This also tests
   * symbol resolution
   */
  it("Context has root literal types assigned", () => {});

  it("Fetches the correct value for a redeclared type", () => {});
});
