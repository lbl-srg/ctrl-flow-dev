import { execSync } from "child_process";
import config from "../src/config";

/**
 * Generates modelica-json from the provided source path and puts generated
 * json in the output path.
 *
 * NOTE: modelica-json has robust diff detection and should only create json
 * for files that don't exist or have changed
 *
 * @param sourcePath
 * @param outputPath
 */
export function createModelicaJson(sourcePath: string, outputPath: string) {
  execSync(
    `node ${config.MODELICA_DEPENDENCIES}/modelica-json/app.js -f ${sourcePath} -o json -d ${outputPath}`,
  );
}
