import {
  parseSelectionKey,
  projectSelectionKey,
  selectionKey,
} from "../../src/utils/selection-key";

describe("Selection keys", () => {
  it("builds and parses the key of an element", () => {
    const key = selectionKey("P.T.c", "a.c");
    expect(key).toEqual("P.T.c-a.c");
    expect(parseSelectionKey(key)).toEqual({
      optionPath: "P.T.c",
      instancePath: "a.c",
    });
  });

  it("keeps quoted identifiers", () => {
    const key = selectionKey("P.T.'p-1'", "'c-d'.'p-1'");
    expect(parseSelectionKey(key)).toEqual({
      optionPath: "P.T.'p-1'",
      instancePath: "'c-d'.'p-1'",
    });
  });

  it("keys a project setting by its option path", () => {
    const optionPath = "Buildings.Templates.Data.AllSystems.stdEne";
    expect(projectSelectionKey(optionPath)).toEqual(optionPath);
    expect(selectionKey(optionPath, "datAll.stdEne")).toEqual(optionPath);
    expect(parseSelectionKey(optionPath)).toEqual({
      optionPath,
      instancePath: undefined,
    });
  });
});
