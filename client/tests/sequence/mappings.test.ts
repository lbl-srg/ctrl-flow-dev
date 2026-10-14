/**
 * The keys of the sequence document mappings are keys of the payload
 * (docs/selection-keys.md, "Mappings").
 *
 * The `Modelica Parameter` column of the mappings holds a key or a key
 * pattern: `P.{A|B}-c.p` stands for `P.A-c.p` and `P.B-c.p`. Each expanded key
 * must be the key under which the client stores the value of the element:
 * resolving its element path in its root class, with the default selections,
 * gives the same key. A path through an outer component or a bound record
 * gives another key (rules 1 and 2), and a missing element no key.
 *
 * The mogrifier reads `value` only: the element is not replaceable, as the
 * class of a replaceable element is a redeclaration. The class is read through
 * its `typ` parameter instead.
 */
import * as fs from "fs";
import * as path from "path";
import RootStore from "../../src/data";
import {
  ConfigContext,
  projectContext,
  resolveInstance,
} from "../../src/interpreter/interpreter";
import { ALL_SYSTEMS, parseSelectionKey } from "../../src/utils/selection-key";

const MAPPINGS = path.resolve(
  __dirname,
  "../../../server/scripts/sequence-doc/src/version/Current G36 Decisions/Guideline 36-2021 (mappings).csv",
);

const store = new RootStore();
const allOptions = store.templateStore.getAllOptions();
const allTemplates = store.templateStore.getAllTemplates();

/** Rows of a CSV file: quoted fields may contain commas, quotes and newlines */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [[]];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += c;
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      rows[rows.length - 1].push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      rows[rows.length - 1].push(field);
      field = "";
      rows.push([]);
    } else {
      field += c;
    }
  }
  rows[rows.length - 1].push(field);
  return rows.filter((row) => row.some((f) => f !== ""));
}

const CLASS_NAME = "[A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*";
const SELECTOR_RE = new RegExp(
  `^(?:(${CLASS_NAME})\\.)?\\{(${CLASS_NAME}(?:\\|${CLASS_NAME})*)\\}$`,
);

/** Keys of a key pattern, or [pattern] for a key */
function expandPattern(pattern: string): string[] {
  const i = pattern.indexOf("-");
  const [selector, elementPath] = [pattern.slice(0, i), pattern.slice(i + 1)];
  const match = SELECTOR_RE.exec(selector);
  if (!match) {
    return [pattern];
  }
  const [, prefix, alternatives] = match;
  return alternatives
    .split("|")
    .map((c) => `${prefix ? `${prefix}.` : ""}${c}-${elementPath}`);
}

const [header, ...rows] = parseCsv(fs.readFileSync(MAPPINGS, "utf8"));
const column = header.indexOf("Modelica Parameter");
const patterns = rows
  .map((row) => row[column])
  .filter((cell) => cell?.includes("-"));

describe("Sequence document mappings", () => {
  it("has key patterns", () => {
    expect(patterns).toContain(
      "Buildings.Templates.ZoneEquipment.{VAVBoxCoolingOnly|VAVBoxReheat}-ctl.have_occSen",
    );
    expect(expandPattern("P.{A|B}-c.p")).toEqual(["P.A-c.p", "P.B-c.p"]);
  });

  it.each(patterns.flatMap(expandPattern))(
    "%s is the key of an element with a value",
    (key) => {
      const { rootClass, elementPath } = parseSelectionKey(key);
      expect([ALL_SYSTEMS, ...Object.keys(allTemplates)]).toContain(rootClass);
      const context =
        rootClass === ALL_SYSTEMS
          ? projectContext(allOptions, {})
          : new ConfigContext(
              allTemplates[rootClass],
              { selections: {} } as any,
              allOptions,
              {},
            );
      const resolution = resolveInstance(elementPath, context);
      expect(resolution?.key).toEqual(key);
      expect(allOptions[resolution?.optionPath as string].replaceable).toBe(
        false,
      );
    },
  );
});
