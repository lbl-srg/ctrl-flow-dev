import * as builder from "../../../src/modelica-builder";

describe("Maps Linkage Input to a Project in .mo format", () => {
  beforeAll(() => {
    //
  });

  it("Maps single configs selections to a completed template", () => {});

  /**
    From: https://lbl-srg.github.io/linkage.js/requirements.html#code-packages-ui
  
    Buildings
    ├── AHUs
    │   └── VAVSingleDuct
    ├── BoilerPlants
    │   └── ...
    ├── ChillerPlants
    │   └── ...
    └── TerminalUnits
        └── ...

    UserProjects
    ├── Project_1
    │   ├── AHUs
    │   │   ├── VAV_1
    │   │   └── Data
    │   ├── BoilerPlants
    │   │   └── ...
    │   ├── ChillerPlants
    │   │   └── ...
    │   └── TerminalUnits
    │       └── ...
    └── {Project_i}
        └── ...

    Also refer to modelica-buildings validation folders:
    https://github.com/lbl-srg/modelica-buildings/tree/issue1374_templates/Buildings/Templates/AirHandlersFans/Validation/UserProject
    */
  it("Creates expected project directory structure", () => {});

  /**
    Refer to modelica-buildings validation folders:
    https://github.com/lbl-srg/modelica-buildings/blob/issue1374_templates/Buildings/Templates/AirHandlersFans/Validation/UserProject/Data/AllSystems.mo
   */
  it("Converts each schedule row into an entry in 'Data.mo' at root of project", () => {});

  /**
    Meta-details of the project should be contained in its own record
   */
  it("Writes out project details into record", () => {});

  /**
    To correctly generate expect outputs, the modelica-buildings version and sequence
    document version need to be stored with the project
   */
  it("Writes out expected modelica-building and sequence document version numbers", () => {});
});
