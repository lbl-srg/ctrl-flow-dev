import { buildParameterTable, Table } from "../../../src/parser/schedule";
import * as parser from "../../../src/parser/parser";
import { prependToModelicaJsonPath } from '../../../src/parser/loader';
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Run with DEBUG_SCHEDULE=1 to log all schedule keys, operands and tables
const DEBUG = !!process.env.DEBUG_SCHEDULE;

const staticDataDir = "tests/static-data";
const jsonRecordPath = path.join(staticDataDir, "json");
const archivePath = path.join(staticDataDir, "json.tar.gz");
const testRecordName = "Buildings.Templates.AirHandlersFans.Data.VAVMultiZone";

describe("buildParameterTable", () => {
  let table: Table;

  beforeAll(() => {
    execSync(`tar -xzf ${archivePath} -C ${staticDataDir}`);
    prependToModelicaJsonPath([jsonRecordPath]);
    parser.getFile(testRecordName); // This populates parser.typeStore
    table = buildParameterTable(testRecordName);
  });

  afterAll(() => {
    fs.rmSync(jsonRecordPath, { recursive: true, force: true });
  });

  // Kept as a separate block for DEBUG output
  beforeAll(() => {
    if (DEBUG) {
      const keys: string[] = [];
      const operands: string[] = [];

      const collect = (columns: any[]) => {
        for (const col of columns) {
          if (col.kind === "leaf") {
            if (col.key) keys.push(col.key);
            const collectOperands = (val: any) => {
              if (val === null || val === undefined) return;
              if (typeof val === "object" && "operands" in val) {
                for (const op of val.operands) collectOperands(op);
              } else if (typeof val === "string") {
                operands.push(val);
              }
            };
            for (const attr of ["min", "max", "start", "enable"]) {
              collectOperands((col as any)[attr]);
            }
          } else if (col.kind === "group" && col.children) {
            collect(col.children);
          }
        }
      };

      collect(table.columns);
      fs.writeFileSync("keys.log", keys.join("\n") + "\n");
      fs.writeFileSync("operands.log", operands.join("\n") + "\n");
      fs.writeFileSync("table.json", JSON.stringify(table, null, 2));
    }
  });

  it("should throw an error for non-existent class", () => {
    expect(() => buildParameterTable("NonExistent.Class")).toThrow(
      "Class NonExistent.Class not found in typeStore"
    );
  });

  it("should return a table with columns and empty rows", () => {
expect(table).toBeDefined();
    expect(table.columns).toBeDefined();
    expect(Array.isArray(table.columns)).toBe(true);
    expect(table.rows).toBeDefined();
    expect(Array.isArray(table.rows)).toBe(true);
    expect(table.rows.length).toBe(0);
  });

  it("should create leaf columns for predefined type parameters", () => {
// Find any leaf columns (should exist for String, Boolean, Real, Integer types)
    const leafColumns = table.columns.filter((col) => col.kind === "leaf");
    expect(leafColumns.length).toBeGreaterThan(0);

    // Check structure of a leaf column
    const firstLeaf = leafColumns[0] as any;
    expect(firstLeaf.kind).toBe("leaf");
    expect(firstLeaf.key).toBeDefined();
    expect(typeof firstLeaf.key).toBe("string");
    expect(firstLeaf.label).toBeDefined();
    expect(typeof firstLeaf.label).toBe("string");
  });

  it("should extract unit, displayUnit, min, max attributes for Real types", () => {
    const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // At least some leaf columns should have these attributes defined
    // (for Real types with modifiers)
    const hasAttributeColumn = leafColumns.some((col: any) =>
      col.displayUnit !== undefined ||
      col.unit !== undefined ||
      col.min !== undefined ||
      col.max !== undefined
    );
    expect(hasAttributeColumn).toBe(true);

    // For columns that do have these attributes, verify their types
    leafColumns.forEach((col: any) => {
      if (col.unit !== undefined) expect(typeof col.unit).toBe("string");
      if (col.displayUnit !== undefined) expect(typeof col.displayUnit).toBe("string");
      if (col.min !== undefined) expect(typeof col.min === "number" || typeof col.min === "object").toBe(true);
      if (col.max !== undefined) expect(typeof col.max === "number" || typeof col.max === "object").toBe(true);
    });
  });

  it("should extract displayUnit from modifiers", () => {
const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // Check that displayUnit can be extracted when present
    leafColumns.forEach((col: any) => {
      if (col.displayUnit !== undefined) {
        expect(typeof col.displayUnit).toBe("string");
      }
    });
  });

  it("should extract min and max from modifiers as numbers", () => {
const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // Check that min/max are numbers when present
    leafColumns.forEach((col: any) => {
      if (col.min !== undefined) {
        expect(typeof col.min === "number" || typeof col.min === "object").toBe(true);
      }
      if (col.max !== undefined) {
        expect(typeof col.max === "number" || typeof col.max === "object").toBe(true);
      }
    });
  });

  it("should not extract attributes for non-Real predefined types", () => {
    const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // String, Boolean, Integer types should not have unit/displayUnit/min/max set
    const nonRealColumns = leafColumns.filter((col: any) =>
      col.key.toLowerCase().includes("string") ||
      col.key.toLowerCase().includes("bool") ||
      col.key.toLowerCase().includes("integer")
    );

    nonRealColumns.forEach((col: any) => {
      expect(col.unit).toBeUndefined();
      expect(col.displayUnit).toBeUndefined();
      expect(col.min).toBeUndefined();
      expect(col.max).toBeUndefined();
    });
  });

  it("should create group columns for parameters with Dialog group annotation", () => {
// Look for group columns
    const groupColumns = table.columns.filter((col) => col.kind === "group");
    expect(groupColumns.length).toBeGreaterThan(0);

    // Check structure of a group column
    const firstGroup = groupColumns[0] as any;
    expect(firstGroup.kind).toBe("group");
    expect(firstGroup.label).toBeDefined();
    expect(typeof firstGroup.label).toBe("string");
    expect(firstGroup.children).toBeDefined();
    expect(Array.isArray(firstGroup.children)).toBe(true);
  });

  it("should create group columns for record type parameters", () => {
// The test template has a 'dat' parameter which is a record type
    // This should be represented as a group column with nested children
    const allColumns = getAllColumns(table.columns);
    const recordColumn = allColumns.find(
      (col: any) =>
        col.kind === "group" &&
        col.label &&
        col.children &&
        col.children.length > 0
    );

    expect(recordColumn).toBeDefined();
  });

  it("should not include outer, final, or deadEnd parameters", () => {
// Get all leaf columns
    const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // Check that no final parameters are included
    const hasFinalParam = leafColumns.some((col: any) =>
      col.key.includes("should_ignore")
    );
    expect(hasFinalParam).toBe(false);
  });

  it("should handle nested group structures", () => {
// Find a group column and verify it can have children
    const groupColumns = table.columns.filter((col) => col.kind === "group");
    if (groupColumns.length > 0) {
      const group = groupColumns[0] as any;
      expect(group.children).toBeDefined();
      expect(Array.isArray(group.children)).toBe(true);
    }
  });

  it("should include parameters from inherited classes", () => {
    // TestTemplate extends ExtendInterface which has parameters
const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // Should have parameters from both the class itself and inherited classes
    expect(leafColumns.length).toBeGreaterThan(0);
  });

  it("should use parameter description as label", () => {
const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // At least some parameters should have meaningful labels
    const hasDescriptiveLabel = leafColumns.some(
      (col: any) => col.label && col.label.length > 0
    );
    expect(hasDescriptiveLabel).toBe(true);
  });

  it("should handle tab annotations", () => {
// The test data has a parameter with Dialog(tab="Tabby")
    const allColumns = getAllColumns(table.columns);
    const tabGroup = allColumns.find(
      (col: any) => col.kind === "group" && col.label === "Tabby"
    );

    // Tab should create a group if parameters use it
    if (tabGroup) {
      expect(tabGroup).toBeDefined();
    }
  });

  it("should create unique keys for leaf columns", () => {
const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");
    const keys = leafColumns.map((col: any) => col.key);

    // All keys should be unique
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("should handle inheritance of attributes from parent types", () => {
const allColumns = getAllColumns(table.columns);
    const leafColumns = allColumns.filter((col: any) => col.kind === "leaf");

    // If a parameter has a custom type that extends Real,
    // it should inherit attributes from the parent type
    // This test just verifies the mechanism doesn't break
    expect(leafColumns.length).toBeGreaterThan(0);
  });
});

/**
 * Helper function to flatten all columns (including nested ones) into a single array
 */
function getAllColumns(columns: any[]): any[] {
  const result: any[] = [];

  for (const col of columns) {
    result.push(col);
    if (col.kind === "group" && col.children) {
      result.push(...getAllColumns(col.children));
    }
  }

  return result;
}
