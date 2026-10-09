/**
 * Scanner for Modelica names (docs/selection-keys.md, "Parsing")
 */
import {
  enclosingName,
  firstIdent,
  hasQuotedIdent,
  isName,
  lastIdent,
  splitName,
  splitSelectionKey,
} from "../../src/utils/names";

describe("Modelica names", () => {
  it("splits names as a plain split when nothing is quoted", () => {
    ["", "a", "a.b.c", ".A.b", "a[1].b"].forEach((name) =>
      expect(splitName(name)).toEqual(name.split(".")),
    );
  });

  it("does not split quoted identifiers", () => {
    expect(splitName("'a.b'")).toEqual(["'a.b'"]);
    expect(splitName("P.'c-d'.'a.b'.e")).toEqual(["P", "'c-d'", "'a.b'", "e"]);
    // Escaped quote and escaped backslash before the closing quote
    expect(splitName("'13\\'H.x'.y")).toEqual(["'13\\'H.x'", "y"]);
    expect(splitName("'a\\\\'.b")).toEqual(["'a\\\\'", "b"]);
    expect(splitName("'\"'.b")).toEqual(["'\"'", "b"]);
  });

  it("throws on unclosed quoted identifiers", () => {
    expect(() => splitName("a.'b")).toThrow("Unclosed quoted identifier");
    expect(() => splitName("a.'b\\'")).toThrow("Unclosed quoted identifier");
  });

  it("gives the first, last and enclosing names", () => {
    const name = "'c-d'.e.'a.b'";
    expect(firstIdent(name)).toEqual("'c-d'");
    expect(lastIdent(name)).toEqual("'a.b'");
    expect(enclosingName(name)).toEqual("'c-d'.e");
    expect(enclosingName(name, 2)).toEqual("'c-d'");
    expect(enclosingName("'a.b'")).toEqual("");
  });

  it("detects quoted identifiers", () => {
    expect(hasQuotedIdent("P.A")).toBe(false);
    expect(hasQuotedIdent("P.'A'")).toBe(true);
    expect(hasQuotedIdent("P.'A.B'.C")).toBe(true);
  });

  it("validates names", () => {
    [
      "a",
      ".Modelica.Units",
      "P.'with-dash'",
      "'c-d'.'a.b'",
      "'13\\'H'",
      "'a \"b\" ?'",
    ].forEach((name) => expect(isName(name)).toBe(true));
    [
      "",
      "1a",
      "a.",
      "a..b",
      "a-b",
      "''", // empty quoted identifier
      "'a'b'",
      "'a\\x'", // invalid escape
      "a[1]",
    ].forEach((name) => expect(isName(name)).toBe(false));
  });

  it("splits selection keys at the first dash outside quoted identifiers", () => {
    expect(splitSelectionKey("P.T.p-a.p")).toEqual(["P.T.p", "a.p"]);
    expect(splitSelectionKey("P.'p-1'-'c-d'.'p-1'")).toEqual([
      "P.'p-1'",
      "'c-d'.'p-1'",
    ]);
    expect(splitSelectionKey("P.AllSystems.stdEne")).toEqual([
      "P.AllSystems.stdEne",
    ]);
  });

  it("keeps escapes as written", () => {
    expect(splitName("P.'a\\\"b'.'c\\?'")).toEqual(["P", "'a\\\"b'", "'c\\?'"]);
    expect(lastIdent("P.'a\\n'")).toEqual("'a\\n'");
  });
});
