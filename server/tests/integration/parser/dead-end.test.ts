import * as parser from "../../../src/parser/parser";
import { initializeTestModelicaJson } from "./utils";

const templatePath = "TestPackage.Template.TestTemplate";
const deadClassPath = "TestPackage.Component.DeadEndComponent";

/**
 * Hard parse skip for __ctrlFlow(enable=false) (#601): the class declared
 * with the annotation is not parsed at all — no ancestors, no elements —
 * and nothing may reference into it.
 */
describe("Dead-end declarations are a hard parse skip (#601)", () => {
  let templateInputs: { [key: string]: parser.TemplateInput };

  beforeAll(() => {
    initializeTestModelicaJson();
    const file = parser.getFile(templatePath) as parser.File;
    const template = file.elementList[0] as parser.LongClass;
    templateInputs = template.getInputs();
  });

  it("never parses a class referenced only through dead-end declarations", () => {
    expect(parser.typeStore.has(deadClassPath)).toBe(false);
  });

  it("produces no entries of the skipped class, and nothing resolves into it", () => {
    const keys = Object.keys(templateInputs);
    expect(keys.some((k) => k.startsWith(deadClassPath))).toBe(false);
    Object.values(templateInputs).forEach((input) => {
      input.inputs?.forEach((ref) => {
        expect(ref.startsWith(deadClassPath)).toBe(false);
      });
    });
  });

  it("still emits a disabled, childless entry for the dead-end component", () => {
    const entry = templateInputs[`${templatePath}.dead_end_component`];
    expect(entry).toBeDefined();
    expect(entry.enable).toBe(false);
    expect(entry.inputs).toEqual([]);
    // The type specifier is retained raw (unresolved)
    expect(entry.type).toBe(deadClassPath);
  });

  it("keeps the dead-end entry referenced with its Dialog group/tab (dialog ordering)", () => {
    // Even a disabled, childless entry anchors the ordering of the parameter
    // dialog: its Dialog annotation is parsed (without type resolution) and
    // it stays in the parent's child list.
    const entry = templateInputs[`${templatePath}.dead_end_component`];
    expect(entry.group).toBe("Skipped Group");
    expect(entry.tab).toBe("Skipped Tab");
    expect(templateInputs[templatePath].inputs).toContain(
      `${templatePath}.dead_end_component`,
    );
  });

  it("skips dead-end extends clauses and short class aliases", () => {
    const userPath = "TestPackage.Component.DeadEndUser";
    const user = parser.typeStore.get(userPath) as parser.LongClass;
    expect(user).toBeDefined();

    // The dead-ended base class contributes no ancestors and no elements
    expect(user.extendsInfo.length).toBe(1);
    expect(user.extendsInfo[0].deadEnd).toBe(true);
    expect(user.extendsInfo[0].element).toBeUndefined();
    expect(user.extendsInfo[0].type).toBe(deadClassPath);

    const inputs = user.getInputs();
    expect(inputs[`${userPath}.live_param`]).toBeDefined();
    // The dead-ended alias yields no inputs
    expect(inputs[`${userPath}.DeadAlias`]).toBeUndefined();
    const alias = parser.typeStore.get(
      `${userPath}.DeadAlias`,
    ) as parser.ShortClass;
    expect(alias.deadEnd).toBe(true);

    // None of the above may have triggered parsing of the dead class
    expect(parser.typeStore.has(deadClassPath)).toBe(false);
  });

  it("skips both the declared type and the constraining type of dead-end replaceables", () => {
    const userPath = "TestPackage.Component.DeadEndUser";
    const user = parser.typeStore.get(userPath) as parser.LongClass;
    const inputs = user.getInputs();

    // Replaceable component / short class, with and without constraining clause
    const cases = [
      "dead_replaceable_unconstrained",
      "dead_replaceable_constrained",
      "DeadAliasUnconstrained",
      "DeadAliasConstrained",
    ];
    cases.forEach((name) => {
      const element = parser.typeStore.get(
        `${userPath}.${name}`,
      ) as parser.Element;
      expect(element).toBeDefined();
      expect(element.deadEnd).toBe(true);
      expect(element.replaceable).toBe(true);
      // The declared/aliased type is retained raw (unresolved)
      expect(element.type).toBe("TestPackage.Component.DeadEndTarget");
    });

    // Dead-end replaceable components still emit a disabled, childless,
    // choiceless entry; dead-end short classes emit nothing
    cases.slice(0, 2).forEach((name) => {
      const entry = inputs[`${userPath}.${name}`];
      expect(entry).toBeDefined();
      expect(entry.enable).toBe(false);
      expect(entry.inputs).toEqual([]);
    });
    cases.slice(2).forEach((name) => {
      expect(inputs[`${userPath}.${name}`]).toBeUndefined();
    });

    // Neither the declared/aliased type nor the constraining type was parsed
    expect(parser.typeStore.has("TestPackage.Component.DeadEndTarget")).toBe(
      false,
    );
    expect(
      parser.typeStore.has("TestPackage.Component.DeadEndConstraint"),
    ).toBe(false);
  });

  it("punches out unresolvable choice references instead of failing (#601)", () => {
    // Upstream medium selectors (choices(choice(redeclare package Medium =
    // Buildings.Media.Air))) alias classes with no modelica-json output:
    // their annotation is now parsed, and each unresolvable choice is
    // dropped rather than throwing "Malformed 'Choices' specified".
    const aliasPath = "TestPackage.Component.UnresolvableChoices.Medium";
    expect(() =>
      parser.typeStore.get("TestPackage.Component.UnresolvableChoices"),
    ).not.toThrow();
    const alias = parser.typeStore.get(aliasPath) as parser.ShortClass;
    expect(alias).toBeDefined();
    expect(alias.deadEnd).toBe(false);
    // The choices annotation was parsed, but no choice survived resolution
    expect(
      alias.annotation.some((m) => m.name === "choices"),
    ).toBe(true);
    expect((alias as any).choices).toEqual([]);
  });

  it("resolves lexical references through a dead-ended base parsed via a live route", () => {
    // PartialComponent is live-parsed via FirstComponent (loaded with the
    // template); the dead-ended extends must not block name resolution into
    // it — __ctrlFlow(enable=false) prunes the UI tree, not Modelica lookup.
    const resolverPath = "TestPackage.Component.DeadEndExtendResolver";
    const resolver = parser.typeStore.get(resolverPath) as parser.LongClass;
    expect(resolver.extendsInfo[0].deadEnd).toBe(true);
    expect(resolver.extendsInfo[0].element).toBeUndefined();
    expect(resolver.extendElement?.modelicaPath).toBe(
      "TestPackage.Interface.PartialComponent",
    );

    const resolved = parser.typeStore.find("icecream", resolverPath);
    expect(resolved?.modelicaPath).toBe(
      "TestPackage.Interface.PartialComponent.icecream",
    );

    // The UI tree stays pruned: the dead-ended base contributes no inputs
    const inputs = resolver.getInputs();
    expect(inputs[`${resolverPath}.local_ref`]).toBeDefined();
    expect(
      inputs["TestPackage.Interface.PartialComponent.icecream"],
    ).toBeUndefined();
  });

});
