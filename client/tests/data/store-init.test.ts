import RootStore from "../../src/data";
import templateData from "../../src/data/templates.json";

describe("package.json loading", () => {
  it("Loads a large list of options", () => {
    const store = new RootStore(templateData);

    const options = store.templateStore.getAllOptions();
    expect(options).toBeDefined();
  });
});
