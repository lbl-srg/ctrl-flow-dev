import fs from "fs/promises";
import path from "path";
import util from "util";
import process from "process";
import { exec, spawn, ChildProcess } from "child_process";
import _ from "underscore";
// Enables the use of async/await keywords when executing external processes.
const execPromise = util.promisify(exec);

const SEQUENCE_PATH = path.resolve(__dirname).replace(process.cwd(), ".");
const SEQUENCE_OUTPUT_PATH = `${SEQUENCE_PATH}/output-documents`;
const STYLE_REFERENCE_DOCUMENT = `${SEQUENCE_PATH}/source-styles.docx`;

export type Selections = {
  [key: string]: any;
};

export async function getDocument(convertedDocumentPath: string) {
  const file = await fs.readFile(convertedDocumentPath);
  return file;
}

export async function generateDoc(selections: Selections, path: string) {
  const script = `python3 -m src/scripts/sequence-doc/src/generate_doc.py`;
  const scriptArgs = `--output ${path}`;
  const scriptCommand = [script, scriptArgs]
    .filter((section) => section != "")
    .join(" ");
  console.log("Running sequence doc generation script:", scriptCommand);

  return new Promise<ChildProcess>((resolve, reject) => {
    const scriptProcess = spawn(scriptCommand);
    // pipe in selections
    // TODO: selections may need to be sanitized
    scriptProcess.stdin.write(JSON.stringify(selections));
    scriptProcess.on("close", (code) => {
      if (code === 0) {
        resolve(scriptProcess);
      } else {
        reject(code);
      }
    });
  });
}

export async function writeControlSequenceDocument(selections: Selections) {
  const timeMarker = new Date().toISOString();
  const fileName = `sequence-${timeMarker}`;
  const filePath = `${SEQUENCE_OUTPUT_PATH}/${fileName}.docx`;

  const { stdout, stderr } = await generateDoc(selections, filePath);
  console.log(stdout);
  console.log(stderr);
  return getDocument(filePath);
}
