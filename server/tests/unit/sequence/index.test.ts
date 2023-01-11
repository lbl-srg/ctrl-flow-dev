import { generateDoc } from "../../../src/sequence";
import fs from "fs";

const EXAMPLE_SELECTIONS = fs.readFileSync(`../../../scripts/sequence-doc/tests/static/real_selections.txt`, {
  encoding: "utf8",
});

const TIMEOUT_IN_MILLISECONDS = 60000;
const tempDirPath = "/tmp/test-linkage-widget";

describe("Control Sequence Document", () => {
  it(
    "convertToDOCX executes without error",
    async () => {
      await generateDoc(EXAMPLE_SELECTIONS, `${tempDirPath}/sequence-doc.docx`);
      return;
    },
    TIMEOUT_IN_MILLISECONDS,
  );
});
