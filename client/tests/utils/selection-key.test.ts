import {
  ALL_SYSTEMS,
  parseSelectionKey,
  selectionKey,
} from "../../src/utils/selection-key";

describe("Selection keys", () => {
  it("builds and parses the key of an element", () => {
    const key = selectionKey("P.T", "a.c");
    expect(key).toEqual("P.T-a.c");
    expect(parseSelectionKey(key)).toEqual({
      rootClass: "P.T",
      elementPath: "a.c",
    });
  });

  it("keeps quoted component identifiers", () => {
    // The first "-" is the separator: rootClass has no quoted identifier
    const key = selectionKey("P.T", "'c-d'.'a.b'.'13\\'H'");
    expect(key).toEqual("P.T-'c-d'.'a.b'.'13\\'H'");
    expect(parseSelectionKey(key)).toEqual({
      rootClass: "P.T",
      elementPath: "'c-d'.'a.b'.'13\\'H'",
    });
  });

  it("keys a project setting in the class of the project settings", () => {
    const key = selectionKey(ALL_SYSTEMS, "stdEne");
    expect(key).toEqual("Buildings.Templates.Data.AllSystems-stdEne");
    expect(parseSelectionKey(key)).toEqual({
      rootClass: ALL_SYSTEMS,
      elementPath: "stdEne",
    });
  });

  it("rejects invalid keys", () => {
    [
      "P.T", // no "-"
      "P.T.a.c", // no "-"
      "-a.c", // no root class
      "P.T-", // no element path
      ".P.T-a", // leading "." in the root class
      "P.'T'-a", // quoted class identifier
      "P.'T-a'-b", // quoted class identifier
      "P.T-a.'b", // unclosed quoted identifier
      "P.T-.a", // leading "." in the element path
      "P.T-a..b",
      "P.T-a[1].b", // array subscript (rule 5)
      "P.T-a-b",
    ].forEach((key) =>
      expect(() => parseSelectionKey(key)).toThrow(
        `Invalid selection key: ${key}`,
      ),
    );
  });
});
