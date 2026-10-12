/**
 * Quoted identifiers (MLS 3.7 §2.3.1, docs/selection-keys.md)
 */
import * as fs from "fs";
import * as path from "path";
import { createModelicaJson } from "../../../scripts/generate-modelica-json";
import { prependToModelicaJsonPath } from "../../../src/parser/loader";
import { loadPackage, getOptions, getTemplates } from "../../../src/parser";
import { Option } from "../../../src/parser/template";
import { fullTempDirPath } from "./utils";

const tempDirPath = "/tmp/test-linkage-widget/";
const T = "QuotedPackage.Template.QuotedTemplate";
const C = "QuotedPackage.Component";
const VALVE = "QuotedPackage.Types.Valve";

let options: { [key: string]: Option };

describe("Quoted identifiers", () => {
  beforeAll(() => {
    createModelicaJson("tests/static-data/QuotedPackage", tempDirPath);
    createModelicaJson("tests/static-data/QuotedClassPackage", tempDirPath);
    prependToModelicaJsonPath([fullTempDirPath]);
    loadPackage("QuotedPackage");
    options = Object.fromEntries(
      getOptions().options.map((o) => [o.modelicaPath, o]),
    );
  });

  it("keeps quoted identifiers whole in option paths", () => {
    expect(options[T].options).toEqual([
      `${T}.'rep.1'`,
      `${T}.'c-d'`,
      `${T}.'with-dash'`,
      `${T}.'why\\?'`,
      `${T}.unquoted`,
      `${T}.valve`,
    ]);
    expect(options[`${T}.'rep.1'`].options).toEqual([
      `${C}.First`,
      `${C}.Second`,
    ]);
  });

  it("builds tree lists without splitting quoted identifiers", () => {
    expect(options[T].treeList).toEqual([T]);
    expect(options[`${C}.First`].treeList).toEqual([
      `${C}.First`,
      `${C}.Partial`,
    ]);
    expect(options[VALVE].treeList).toEqual([VALVE]);
  });

  it("supports quoted enumeration literals", () => {
    const literals = [
      `${VALVE}.'two-way'`,
      `${VALVE}.'three.way'`,
      `${VALVE}.'13\\'H'`, // escaped quote kept as written
      `${VALVE}.plain`,
    ];
    expect(options[VALVE].options).toEqual(literals);
    expect(options[`${T}.valve`].value).toEqual(`${VALVE}.'13\\'H'`);
    expect(options[`${C}.Partial.'val-1'`].value).toEqual(`${VALVE}.'two-way'`);
  });

  it("keeps redundant escapes as written", () => {
    expect(options[`${T}.'why\\?'`]).toBeDefined();
    expect(options[`${T}.'why?'`]).toBeUndefined();
    expect(options[`${T}.unquoted`].value).toEqual("'why\\?'");
    expect(options[`${T}.unquoted`].enable).toEqual("'why\\?'");
    expect(options[`${C}.Partial.'k\\?'`]).toBeDefined();
  });

  it("parses modifiers and expressions with quoted names", () => {
    expect(options[`${T}.'c-d'`].modifiers).toEqual({
      [`${T}.'c-d'.'a.b'`]: { expression: false, final: false },
      [`${T}.'c-d'.'val-1'`]: {
        expression: `${VALVE}.'three.way'`,
        final: false,
      },
    });
    expect(options[`${T}.'why\\?'`].value).toEqual("'c-d'.'a.b'");
    expect(options[`${T}.'why\\?'`].enable).toEqual("'with-dash'");
    expect(options[`${C}.Partial.'k\\?'`].enable).toEqual("'a.b'");
  });

  it("rejects quoted class identifiers", () => {
    expect(() => loadPackage("QuotedClassPackage")).toThrow(
      /Quoted class identifiers are not supported: 'Q' in .*QuotedClassPackage/,
    );
  });

  afterAll(() => {
    // Generate options-QuotedTemplate.json for client tests
    const template = getTemplates().find((t) => t.modelicaPath === T);
    const outputPath = path.resolve(
      __dirname,
      "../../../../client/tests/data/options-QuotedTemplate.json",
    );
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ template, options }, null, 2) + "\n",
    );
  });
});
