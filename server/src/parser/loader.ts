import path from "path";
import fs from "fs";

export default function (prefix: string, reference: string) {
  const { dir, name } = path.parse(reference.replace(/\./g, "/"));
  const jsonFile = path.resolve(prefix, dir, name) + ".json";

  if (fs.existsSync(jsonFile)) {
    return require(jsonFile);
  } else {
    throw new Error(`${jsonFile} could not be found!!`);
    // const defFile = dir + ".json";
    // // console.log("//////////// file does not exist....");
    // if (!fs.existsSync(defFile)) {
    //   // console.log(chalk.red(jsonFile));
    //   return {};
    // }
    // const data = require(dir + ".json");
    // const elements =
    //   data.class_definition[0].class_specifier.long_class_specifier.composition
    //     .element_list;
    // const desiredClass = elements.find((el: any) => {
    //   return (
    //     el.class_definition?.class_specifier?.short_class_specifier
    //       ?.identifier === name
    //   );
    // });
    // return desiredClass || data;
  }
}
