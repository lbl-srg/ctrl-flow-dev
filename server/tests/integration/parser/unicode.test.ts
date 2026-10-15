/**
 * Non-ASCII characters in strings: Modelica files are stored in UTF-8
 * (MLS 3.7 §13.4) and a string may contain any Unicode character (A.1),
 * while identifiers are ASCII only (§2.1)
 */
import * as fs from "fs";
import * as path from "path";
import { createModelicaJson } from "../../../scripts/generate-modelica-json";
import { prependToModelicaJsonPath } from "../../../src/parser/loader";
import { loadPackage, getOptions, getTemplates } from "../../../src/parser";
import { Option } from "../../../src/parser/template";
import { fullTempDirPath } from "./utils";

const tempDirPath = "/tmp/test-linkage-widget/";
const T = "UnicodePackage.Template";

let options: { [key: string]: Option };

describe("Non-ASCII characters", () => {
  beforeAll(() => {
    createModelicaJson("tests/static-data/UnicodePackage", tempDirPath);
    prependToModelicaJsonPath([fullTempDirPath]);
    loadPackage("UnicodePackage");
    options = Object.fromEntries(
      getOptions().options.map((o) => [o.modelicaPath, o]),
    );
  });

  it("finds the template declared in the file of the root package", () => {
    expect(
      getTemplates().map(({ modelicaPath, systemTypes }) => [
        modelicaPath,
        systemTypes,
      ]),
    ).toEqual([[T, ["UnicodePackage"]]]);
  });

  it("keeps non-ASCII characters in descriptions and annotations", () => {
    expect(options[`${T}.have_dpLoc`].name).toEqual("Local CHW ∆p sensor");
    expect(options[`${T}.have_dpLoc`].group).toEqual("Capteurs – débit");
    expect(options[`${T}.lab`].name).toEqual("Étiquette");
  });

  it("keeps non-ASCII characters in string values", () => {
    expect(options[`${T}.lab`].value).toEqual('"Pompe n°1"');
  });

  // modelica-json <2.0.0 writes the output of its Java parser in the encoding
  // of the locale (#657). Version 2.0.0 has no Java dependency but cannot be
  // used yet (lbl-srg/modelica-json#327). If this test passes after the
  // upgrade, replace `it.failing` with `it` and remove the locale workaround
  // of server/Dockerfile.
  it.failing("keeps non-ASCII characters without a UTF-8 locale", () => {
    const outputPath = "/tmp/test-linkage-widget-ascii/";
    fs.rmSync(outputPath, { recursive: true, force: true });
    createModelicaJson("tests/static-data/UnicodePackage", outputPath, {
      ...process.env,
      LANG: "C",
      LC_ALL: "C",
    });
    const json = fs.readFileSync(
      path.join(
        outputPath,
        "json/tests/static-data/UnicodePackage/package.json",
      ),
      "utf8",
    );
    expect(json).toContain("Local CHW ∆p sensor");
    expect(json).toContain("Pompe n°1");
  });
});
