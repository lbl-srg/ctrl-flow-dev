import path from "path";
import * as loader from "./loader";
import * as parser from "./parser";
import * as template from "./template";

/**
 *
 * @param packagePath Absolute path to package
 *
 * @returns Templates
 */
export function loadPackage(packagePath: string): IterableIterator<template.Template> {
  //
  const parsedPath = path.parse(packagePath);

  parser.setPathPrefix(parsedPath.dir)
  parser.loadPackage(parsedPath.name);

  return template.getTemplates();
}

export function getTemplates() {
  return template.getTemplates();
}

export function getSystemTypes() {
  return template.getSystemTypes();
}
