import RootStore from "../../src/data";

describe("package.json loading", () => {
  it("Loads a large list of options", () => {
    const store = new RootStore();

    const options = store.templateStore.getAllOptions();
    expect(options).toBeDefined();
  });
});
