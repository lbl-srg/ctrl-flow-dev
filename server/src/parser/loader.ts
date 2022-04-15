import path from "path";
import fs from "fs";

export default function (prefix: string, reference: string) {

  let parsedPath = path.parse(reference.replace(/\./g, "/"));
  let jsonFile = path.resolve(prefix, parsedPath.dir, parsedPath.name) + ".json";

  while (!fs.existsSync(jsonFile) && parsedPath.name) {
    parsedPath = path.parse(parsedPath.dir);
    jsonFile = path.resolve(prefix, parsedPath.dir, parsedPath.name) + ".json";
  }

  if (fs.existsSync(jsonFile)) {
    return require(jsonFile);
  } else {
    throw new Error(`${jsonFile} could not be found!!`);
  }
}
