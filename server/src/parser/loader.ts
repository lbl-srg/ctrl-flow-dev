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
    if (!reference.startsWith('Modelica')) { // TODO: how to handle modelica standard library
      throw new Error(`${jsonFile} could not be found!!`);  
    }
    // TODO: check if a 'Modelica' path - we have nothing to import here
    // The extend clause is failing because of this!
  }
}
