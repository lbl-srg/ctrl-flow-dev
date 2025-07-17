import {
  buildSequenceData,
  mapConfigData,
  _buildSequenceData,
} from "../../src/data/export-utils";

import { createTemplateContext, TestTemplate } from "../utils";

type MapCfg = Record<string, string>;

describe("mapSequenceData", () => {
  it("maps heterogeneous primitive values", () => {
    const input = {
      a: { value: 42 },
      b: { value: "hello" },
      c: { value: true },
    } as const;

    const expected = {
      a: 42,
      b: "hello",
      c: true,
    } as const;

    expect(mapConfigData<number | string | boolean>(input)).toEqual(expected);
  });
});

describe("buildSeqData", () => {
  it("collects unique values per key across many configs", () => {
    const mapped: MapCfg[] = [
      { "pipe-A": "start_1", "tank-B": "fill" },
      { "pipe-A": "start_2", "tank-B": "drain" },
      { "pipe-A": "start_1" }, // dup should be ignored
    ];

    const result = _buildSequenceData(mapped);

    expect(result).toEqual({
      "pipe-A": ["start_1", "start_2"],
      "tank-B": ["fill", "drain"],
    });
  });

  it("ignores entries whose value equals the Modelica-path part of the key", () => {
    const mapped: MapCfg[] = [
      { "foo-bar": "foo" }, // "foo" should be ignored
      { "foo-bar": "baz" }, // still ignored
    ];

    const result = _buildSequenceData(mapped);

    expect(result).toEqual({
      "foo-bar": ["baz"], // only non-self-echo values kept
    });
  });

  it("returns an empty object for an empty input list", () => {
    expect(_buildSequenceData([])).toEqual({});
  });

  it("handles keys that appear only once", () => {
    const mapped: MapCfg[] = [{ "alpha-beta": "gamma" }];

    expect(_buildSequenceData(mapped)).toEqual({ "alpha-beta": ["gamma"] });
  });

  it("preserves insertion order of first occurrence per key", () => {
    const mapped: MapCfg[] = [
      { "x-y": "b" }, // 'b' first
      { "x-y": "c" },
    ];

    expect(_buildSequenceData(mapped)["x-y"]).toEqual(["b", "c"]);
  });
});

describe("buildSequenceData", () => {
  it("Given configs outputs in the sequence data format ", () => {
    const { store } = createTemplateContext(TestTemplate.MultiZoneTemplate);
    const configs = store.configStore.getConfigsForProject();

    const sequenceData = buildSequenceData(configs);
    for (const [key, val] of Object.entries(sequenceData)) {
      expect(typeof key).toBe("string"); // every key is a string
      expect(Array.isArray(val)).toBe(true); // every value is an array
      val.forEach((el) => expect(typeof el).toBe("string"));
    }
  });
});
