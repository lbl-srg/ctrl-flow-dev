import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { Z_FIXED } from "zlib";

const TEMPLATE_IDENTIFIER = "__LinkageTemplate";

export function loadPackage(prefix: string, reference: string) {
  try {
    const cmd = `grep -rl ${path.resolve(
      prefix,
      reference,
    )} -e "${TEMPLATE_IDENTIFIER}"`;
    const response = execSync(cmd).toString();
    return response
      .split("\n")
      .filter((p) => p != "")
      .map((p) => path.relative(prefix, p))
      .map((p) => loader(prefix, p));
  } catch (error: any) {
    console.log(`Status Code: ${error.status} with '${error.message}'`);
  }
}

// When given a path, loads types
export function loader(prefix: string, reference: string): Object | undefined {
  let parsedPath = path.parse(reference.replace(/\./g, "/"));
  let jsonFile = path.resolve(
    prefix,
    parsedPath.dir,
    `${parsedPath.name}.json`,
  );

  while (!fs.existsSync(jsonFile) && parsedPath.name) {
    // package definitions break the typical modelica path to file mapping that
    // is used. A typical modelica path to file path look like:
    //  'Template.AirHandlerFans.VAVMultizone' -> 'Template/AirhandlerFans/VAVMultizone
    // We need to support mapping like this as well:
    //  'Template.AirHandlerFans -> Template/AirhandlerFans/package'
    // 'package' files behave kind of like 'index.html' files
    jsonFile = path.resolve(parsedPath.dir, parsedPath.name, "package.json");
    if (fs.existsSync(jsonFile)) {
      break;
    }
    parsedPath = path.parse(parsedPath.dir);
    jsonFile = path.resolve(prefix, parsedPath.dir, parsedPath.name) + ".json";
  }

  if (fs.existsSync(jsonFile)) {
    return require(jsonFile);
  } else {
    // Templates *should* have all types defined within a template so we do not need
    // to rely on definitionals in the modelica standard library
    if (!reference.startsWith("Modelica")) {
      throw new Error(`${jsonFile} could not be found!!`);
    }
  }
}
