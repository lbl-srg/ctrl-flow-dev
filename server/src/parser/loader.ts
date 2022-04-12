import path from "path";
import fs from "fs";

const pathPrefix: string = path.join(
  __dirname,
  "../../../build/modelica-json/json/",
);

export default function (reference: string) {
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

    const elements =
      data.class_definition[0].class_specifier.long_class_specifier.composition
        .element_list;

    const desiredClass = elements.find((el: any) => {
      return (
        el.class_definition?.class_specifier?.short_class_specifier
          ?.identifier === name
      );
    });

    return desiredClass || data;
  }
}
