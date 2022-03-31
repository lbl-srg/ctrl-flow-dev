const path = require("path");
const fs = require("fs");
const pathPrefix = path.join(__dirname, "../../../build/modelica-json/json/");

module.exports = {
  pathPrefix,
  getFile(reference) {
    const jsonFile = reference.replace(/\./g, "/") + ".json";
    const desiredFile = path.join(pathPrefix, jsonFile);
    const { name, dir } = path.parse(desiredFile);

    if (fs.existsSync(desiredFile)) return require(desiredFile);
    else {
      const data = require(dir + ".json");

      console.log(dir + "json");

      const elements =
        data.class_definition[0].class_specifier.long_class_specifier
          .composition.element_list;

      const desiredClass = elements.find((el) => {
        return (
          el.class_definition?.class_specifier?.short_class_specifier
            ?.identifier === name
        );
      });

      // debugger;

      return data;
    }
  },
};
