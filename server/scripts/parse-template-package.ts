import fs from "fs";
import os from "os";
import path from "path";

import {
  loadPackage,
  getTemplates,
  getSystemTypes,
  getOptions,
} from "../src/parser";
import { createModelicaJson } from "./generate-modelica-json";

/**
 * Version of a library: the `version` annotation of its root package
 * (MLS 18.8.2), found on MODELICAPATH. The root package is converted with
 * modelica-json, as only the templates are converted when the image is built.
 */
function getLibraryVersion(library: string): string | undefined {
  const dir = (process.env.MODELICAPATH ?? "")
    .split(path.delimiter)
    .find((d) => fs.existsSync(path.join(d, library, "package.mo")));
  if (!dir) {
    return undefined;
  }
  const outputPath = fs.mkdtempSync(path.join(os.tmpdir(), "library-"));
  createModelicaJson(path.join(dir, library, "package.mo"), outputPath);
  const json = JSON.parse(
    fs.readFileSync(
      path.join(outputPath, "json", library, "package.json"),
      "utf8",
    ),
  );
  const annotation: any[] =
    json.stored_class_definitions[0].class_specifier.long_class_specifier
      .composition?.annotation ?? [];
  const version = annotation
    .map((a) => a.element_modification_or_replaceable?.element_modification)
    .find((m) => m?.name === "version");
  return (
    version && JSON.parse(version.modification.expression.simple_expression)
  );
}

loadPackage("Buildings.Templates");

const { options, scheduleOptions } = getOptions();

const data = {
  // Versions of the libraries the templates are generated from
  libraries: { Buildings: getLibraryVersion("Buildings") },
  templates: getTemplates(),
  systemTypes: getSystemTypes(),
  options: options,
  scheduleOptions: scheduleOptions,
};

const dest = path.resolve(
  `${__dirname}/templates.json`,
);

fs.writeFileSync(dest, JSON.stringify(data, null, 2));
