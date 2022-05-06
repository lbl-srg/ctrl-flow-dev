import path from "path";
import * as loader from "./loader";
import * as parser from "./parser";
import * as template from "./template";
export { SystemType, Template } from "./template";

/**
 *
 * @param packagePath Absolute path to package
 *
 * @returns Templates
 */
export function loadPackage(packagePath: string): template.Template[] {
  //
  const parsedPath = path.parse(packagePath);

  parser.setPathPrefix(parsedPath.dir)
  parser.loadPackage(parsedPath.name);

  return template.getTemplates();
}

export function getTemplates(): template.Template[] {
  return template.getTemplates();
}

export function getSystemTypes(): template.SystemType[] {
  return template.getSystemTypes();
}
