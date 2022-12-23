import Translations from "../types";
import onboarding from "./onboarding";
import terms from "./terms";

const en: Translations = {
  onboarding,
  terms,

  phrases: {
    addConfig: "Add Config",
    addConfigs: "Add Configurations For The System Types You Selected",
    allDownloads: "All Downloads",
    allProjects: "All Projects",
    downloadSelected: "Download selected",
    energyStandard: "Energy Standard",
    ventilationStandard: "Ventilation Standard",
    ashraeZone: "ASHRAE Climate Zone",
    californiaZone: "California Title 24 Climate Zone",
    lastSaved: "last saved {0} hours ago",
    nextStep: "Next Step",
    projectName: "Project Name",
    scheduleInstruct:
      "Add tags, IDs, and quantities for your selected systems. Edit your system's schedule directly from the table.",
    selectToDownload: "Select a Document to Download",
  },
};

export default en;
