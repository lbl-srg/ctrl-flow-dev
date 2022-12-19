import { generateDoc } from "../../../src/sequence";
// TODO: this is a duplicate of scripts/sequence-doc/tests/static/example_selection.txt
// We should import this rather than copying
const EXAMPLE_SELECTIONS = {
  "Buildings.Templates.ZoneEquipment.Components.Controls.Interfaces.PartialVAVBoxController.have_CO2Sen":
    [false],
  "Buildings.Controls.OBC.ASHRAE.G36.AHUs.MultiZone.VAV.Controller.buiPreCon": [
    "ReturnFanCalculatedAir",
  ],
  "Buildings.Templates.ZoneEquipment.Types.Configuration": ["CO"],
  "Buildings.Templates.Data.AllSystems.stdEne": ["Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1"],
  "Buildings.Templates.Data.AllSystems.stdVen": ["Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24"],
  "Buildings.Templates.Data.AllSystems.sysUni": ["Buildings.Templates.Types.Units.SI"],
  DEL_INFO_BOX: [false],
};

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
