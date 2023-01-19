import fs from "fs/promises";
import path from "path";
import util from "util";
import process from "process";
import { exec, spawn, ChildProcess } from "child_process";
import _ from "underscore";
// Enables the use of async/await keywords when executing external processes.
const execPromise = util.promisify(exec);

const SEQUENCE_PATH = path.resolve('/tmp');
const SEQUENCE_OUTPUT_PATH = `${SEQUENCE_PATH}`;

export type Selections = {
  [key: string]: any;
};

export type SequenceData = {
  [key: string]: any[];
}

export async function getDocument(convertedDocumentPath: string) {
  const file = await fs.readFile(convertedDocumentPath);
  return file;
}

export async function generateDoc(selections: SequenceData, path: string) {
  const program = `python3`;
  const scriptArgs = ['scripts/sequence-doc/src/generate_doc.py', '-o', `${path}`];

  return new Promise<ChildProcess>((resolve, reject) => {
    const scriptProcess = spawn(program, scriptArgs);
    // pipe in selections
    // TODO: selections may need to be sanitized
    scriptProcess.stdin.write(JSON.stringify(selections));
    scriptProcess.stdin.end();

    // stdout and stderr need to have callbacks to close the process
    // TODO: figure out best place to log response
    scriptProcess.stdout.on('data', (data) => console.log(`${data}`));
    scriptProcess.stderr.on('data', (data) => console.log(`${data}`));
    scriptProcess.on("close", (code) => {
      if (code === 0) {
        resolve(scriptProcess);
      } else {
        reject(code);
      }
    });
  });
}

export async function writeControlSequenceDocument(selections: SequenceData) {
  const timeMarker = new Date().toISOString();
  const fileName = `sequence-${timeMarker}`;
  const filePath = `${SEQUENCE_OUTPUT_PATH}/${fileName}.docx`;

  const { stdout, stderr } = await generateDoc(selections, filePath);
  const file = await getDocument(filePath);
  // console.log(stdout);
  // console.log(stderr);
  return { file, filePath };
}
