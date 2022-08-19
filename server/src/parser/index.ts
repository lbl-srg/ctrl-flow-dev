import path from "path";
import * as loader from "./loader";
import * as parser from "./parser";
import * as templates from "./template";
export { SystemTypeN as SystemType, Template } from "./template";

/**
 *
 * @param packagePath Absolute path to package
 *
 * @returns Templates
 */
export function loadPackage(packagePath: string): templates.SystemTemplateN[] {
  //
  const parsedPath = path.parse(packagePath);

  parser.setPathPrefix(parsedPath.dir);
  parser.loadPackage(parsedPath.name);

  return templates.getTemplates().map((t) => t.getSystemTemplate());
}

export function getTemplates(): templates.SystemTemplateN[] {
  return templates.getTemplates().map((t) => t.getSystemTemplate());
}

export function getSystemTypes(): templates.SystemTypeN[] {
  return templates.getSystemTypes();
}

export function getOptions() {
  return templates.getOptions();
}
