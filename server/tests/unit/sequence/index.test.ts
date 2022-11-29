import { generateDoc } from "../../../src/sequence";

const EXAMPLE_SELECTIONS = {
  "Buildings.Templates.ZoneEquipment.Components.Controls.Interfaces.PartialVAVBoxController.have_CO2Sen":
    false,
  "Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon":
    "ReturnFanCalculatedAir",
  "Buildings.Templates.ZoneEquipment.Types.Configuration": "CO",
  DEL_ENERGY_ASHRAE: true,
  DEL_ENERGY_TITLE24: false,
  DEL_VENTILATION_ASHRAE: true,
  DEL_VENTILATION_TITL24: false,
  UNITS: "SI",
  DEL_INFO_BOX: false,
};
const TIMEOUT_IN_MILLISECONDS = 30000;
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
