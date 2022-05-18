import Translations from "../types";

const onboarding: Translations["onboarding"] = [
  {
    title: "Welcome to the High Performance Controls Design Tool",
    copy: "Writing a detailed and accurate control sequence is hard to do! This tool makes it easy to design high performance control sequences following ASHRAE Guideline 36 and best practices. After inputting project details, the tool will produce everything you need for your control sequence design — including a detailed sequence of operations, control diagrams, points lists, and schedules. Note: Use this tool as your project evolves, provide the details you have now, then come back later and add additional details for a more detailed set of outputs. The tool will also create the customized control logic for a project in an open format based on the ASHRAE standard 231P. A Controls Description Language (.CDL) file includes both the control logic and a model for the selected mechanical systems using the modeling language, Modelica. This can be used to test the control logic and perform detailed energy modeling. The Controls Exchange Format (.CXF) has the control logic to help the project’s controls contractor jumpstart their work in programming the control system.",
    points: [],
  },

  {
    title: "Enter Project Details",
    copy: "Create New Project",
    points: [
      "Notes field for any info needed including client info, additional codes, etc…",
      "After this page, edit project details from the edit button on the top of the lefthand sidebar",
    ],
  },

  {
    title: "Select Systems",
    copy: "Select the systems you intend to use on your project:",
    points: [
      "Added systems will populate in the sidebar in the appropriate category.",
      "Add or remove desired systems within the sidebar.",
    ],
  },

  {
    title: "Create Configurations",
    copy: "Provide details about each system:",
    points: [
      "Use “upload” to select pre-configured or previously used equipment configurations",
      "Once configured, choose “download” to save this configuration for future use",
      "On the next step, select how many of each configuration are needed for the project",
    ],
  },

  {
    title: "View and Edit Schedule",
    copy: "Develop your equipment schedules:",
    points: [
      "Customize each equipment's schedule",
      "Select the “Quantity” of each configuration",
      "The ”Tag” cell is the “Equipment Tag + Starting ID” and count up based on the quantity selected",
      "Use the tabs to toggle between the Controls and Mechanical settings",
      "Control values entered here will be reflected in the written sequence",
    ],
  },

  {
    title: "View and Edit Schedule",
    copy: "Table Editing Options:",
    points: [
      "Edit the table directly on this site",
      "OR Download to edit in any spreadsheet program then re-upload to the tool",
      "Click directly in the cell to add a value",
      "Drag values down the table",
      "Rearrange one or more rows by clicking and dragging the row numbers",
      "Add or remove rows",
    ],
  },

  {
    title: "View and Download Results",
    copy: "After designing the high performance control system, view and download the results in the tool, and download files for use.",
    points: [],
  },
];

export default onboarding;
