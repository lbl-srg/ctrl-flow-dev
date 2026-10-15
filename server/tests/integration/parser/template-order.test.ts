/**
 * Order of the templates and of the system types (docs/template-order.md)
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createModelicaJson } from "../../../scripts/generate-modelica-json";
import {
  prependToModelicaJsonPath,
  TEMPLATE_LIST,
  PACKAGE_LIST,
} from "../../../src/parser/loader";
import {
  loadPackage,
  getTemplates,
  getSystemTypes,
} from "../../../src/parser";

/**
 * Converts a fixture of tests/static-data into a new directory, so that the
 * output does not depend on an earlier conversion (modelica-json does not
 * convert a package.mo again if only its package.order changed)
 */
function convert(packageName: string) {
  const outputPath = fs.mkdtempSync(path.join(os.tmpdir(), "template-order-"));
  createModelicaJson(`tests/static-data/${packageName}`, outputPath);
  prependToModelicaJsonPath([path.join(outputPath, "json/tests/static-data")]);
}

describe("Order of the library", () => {
  const templates = [
    "OrderPackage.Zeta.TB",
    "OrderPackage.Zeta.Nested.T",
    "OrderPackage.Zeta.TA",
    "OrderPackage.Alpha.T",
    "OrderPackage.SingleFile.B",
    "OrderPackage.SingleFile.A",
  ];
  const systemTypes = [
    "OrderPackage.Zeta",
    "OrderPackage.Zeta.Nested",
    "OrderPackage.Alpha",
    "OrderPackage.SingleFile",
  ];

  beforeAll(() => {
    convert("OrderPackage");
    loadPackage("OrderPackage");
  });

  it("orders the templates", () => {
    expect(TEMPLATE_LIST).toEqual(templates);
    expect(getTemplates().map(({ modelicaPath }) => modelicaPath)).toEqual(
      templates,
    );
  });

  it("orders the system types, a package before its classes", () => {
    expect(PACKAGE_LIST).toEqual(["OrderPackage", ...systemTypes]);
    expect(getSystemTypes().map(({ modelicaPath }) => modelicaPath)).toEqual(
      systemTypes,
    );
  });

  it("assigns the enclosing package as system type", () => {
    expect(
      Object.fromEntries(
        getTemplates().map(({ modelicaPath, systemTypes }) => [
          modelicaPath,
          systemTypes,
        ]),
      ),
    ).toEqual({
      "OrderPackage.Zeta.TB": ["OrderPackage.Zeta"],
      "OrderPackage.Zeta.Nested.T": ["OrderPackage.Zeta.Nested"],
      "OrderPackage.Zeta.TA": ["OrderPackage.Zeta"],
      "OrderPackage.Alpha.T": ["OrderPackage.Alpha"],
      "OrderPackage.SingleFile.B": ["OrderPackage.SingleFile"],
      "OrderPackage.SingleFile.A": ["OrderPackage.SingleFile"],
    });
  });
});

describe("Errors of discovery", () => {
  it("rejects a package in which no template is found", () => {
    expect(() => loadPackage("NoSuchPackage")).toThrow(
      'No template (class annotation __ctrlFlow(routing="template")) in NoSuchPackage',
    );
  });
});

describe("Errors of package.order", () => {
  it("rejects a missing package.order", () => {
    convert("OrderMissingPackage");
    expect(() => loadPackage("OrderMissingPackage")).toThrow(
      "Missing package.order in OrderMissingPackage",
    );
  });

  it("rejects a template not listed in package.order", () => {
    convert("OrderUnlistedPackage");
    expect(() => loadPackage("OrderUnlistedPackage")).toThrow(
      "T is not listed in the package.order of OrderUnlistedPackage",
    );
  });

  it("rejects a template listed more than once in package.order", () => {
    convert("OrderDuplicatePackage");
    expect(() => loadPackage("OrderDuplicatePackage")).toThrow(
      "T is listed more than once in the package.order of OrderDuplicatePackage",
    );
  });
});
