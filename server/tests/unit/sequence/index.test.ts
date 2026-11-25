import { checkPayload, generateDoc } from "../../../src/sequence";
import fs from "fs";

const EXAMPLE_PAYLOAD = JSON.parse(
  fs.readFileSync(
    `scripts/sequence-doc/tests/static/golden/mixed--ahu-co-rh.payload.json`,
    { encoding: "utf8" },
  ),
);

const TIMEOUT_IN_MILLISECONDS = 60000;
const tempDirPath = "/tmp/test-linkage-widget";

describe("Control Sequence Document", () => {
  it(
    "convertToDOCX executes without error",
    async () => {
      fs.mkdirSync(tempDirPath, { recursive: true });
      await generateDoc(EXAMPLE_PAYLOAD, `${tempDirPath}/sequence-doc.docx`);
      return;
    },
    TIMEOUT_IN_MILLISECONDS,
  );

  it("Accepts a payload with exactly one project only", () => {
    expect(checkPayload(EXAMPLE_PAYLOAD)).toBeNull();
    const project = EXAMPLE_PAYLOAD.projects[0];
    expect(checkPayload({ ...EXAMPLE_PAYLOAD, projects: [] })).toMatch(
      "exactly one project, got 0",
    );
    expect(
      checkPayload({ ...EXAMPLE_PAYLOAD, projects: [project, project] }),
    ).toMatch("exactly one project, got 2");
    expect(checkPayload({ ...EXAMPLE_PAYLOAD, schemaVersion: 2 })).toMatch(
      "Unsupported payload schema version: 2",
    );
    // Payload of the client before #650
    expect(checkPayload({ DEL_INFO_BOX: [false] })).toMatch(
      "Unsupported payload schema version",
    );
  });
});
