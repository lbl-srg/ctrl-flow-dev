const path = require("path");
const fs = require("fs");
const pathPrefix = path.join(__dirname, "../../../build/modelica-json/json/");
const chalk = require("chalk");

module.exports = {
  pathPrefix,
  getFile(reference) {
    const jsonFile = reference.replace(/\./g, "/") + ".json";
    const desiredFile = path.join(pathPrefix, jsonFile);
    const { name, dir } = path.parse(desiredFile);

    if (fs.existsSync(desiredFile)) {
      // console.log(chalk.green(jsonFile));
      return require(desiredFile);
    } else {
      const defFile = dir + ".json";

      if (!fs.existsSync(defFile)) {
        // console.log(chalk.red(jsonFile));
        return {};
      }

      const data = require(dir + ".json");

      // console.log(dir + "json");

      const elements =
        data.class_definition[0].class_specifier.long_class_specifier
          .composition.element_list;

      const desiredClass = elements.find((el) => {
        return (
          el.class_definition?.class_specifier?.short_class_specifier
            ?.identifier === name
        );
      });

      return data;
    }
  },
};
