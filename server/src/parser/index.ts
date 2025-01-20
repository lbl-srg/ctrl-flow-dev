import path from "path";
import * as loader from "./loader";
import * as parser from "./parser";
import * as templates from "./template";
export { SystemTypeN as SystemType, Template } from "./template";

/**
 *
 * @param packageName Full class name of package (e.g. "Library.Package.SubPackage")
 *
 * @returns Templates
 */
export function loadPackage(packageName: string): templates.SystemTemplateN[] {
  parser.loadPackage(packageName);
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

export function getAllTemplates(): templates.Template[] {
  return templates.getTemplates();
}

export function getProject(): templates.Project {
  return templates.getProject();
}
