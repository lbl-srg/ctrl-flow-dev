/**
 * Store for linkage widget
 *
 * If there are any updates to the store schema increment SCHEMA_VERSION
 */

import create from "zustand";
import { devtools, persist } from "zustand/middleware";

// import getMockData from "./mock-data";
import uiSlice from "./slices/ui-slice";
import projectSlice from "./slices/project-slice";
import userSlice from "./slices/user-slice";
import npmPackage from "../../package.json";

// import { sortByName, SortableByName } from "../utils/utils";
import templateSlice from "./slices/template-slice";

const SCHEMA_VERSION = parseFloat(npmPackage.version);

// const _getTemplates: GetAction<SystemTemplate[]> = (get) => {
//   const templatesN = get().templates;
//   const options = _getAllOptions(get);

//   return templatesN.map((t) => ({
//     id: t.id,
//     systemType: get().systemTypes.find(
//       (sType) => sType.id === t.systemType,
//     ) as SystemType,
//     name: t.name,
//     options: t.options
//       ? t.options?.map((oID) => options.find((o) => oID === o.id) as Option)
//       : [],
//   }));
// };

// const _getAllOptions: (get: GetState<State>) => Option[] = (get) => {
//   // denormalize list in two passes: first create options without child options
//   // then populate child options after references have been created
//   const optionsN = get().options;
//   const options = optionsN.map(
//     (o) => ({ ...o, ...{ options: undefined } } as Option),
//   );
//   options.map((o) => {
//     const optionN = optionsN.find((option) => option.id === o.id) as OptionN;
//     if (optionN.options) {
//       o.options = optionN.options.map(
//         (cID) => options.find((option) => cID === option.id) as Option,
//       );
//     }
//   });

//   return options;
// };

// for a given template, returns two lists: the initial options and all available options
// const _getOptions: (
//   template: SystemTemplate,
//   get: GetState<State>,
// ) => [Option[], Option[]] = (template, get) => {
//   const optionIDs: number[] = [];
//   const templateOptionsN: OptionN[] = [];
//   const initOptions = template.options || [];

//   if (template.options) {
//     const options = get().options;
//     optionIDs.push(...template.options.map((o) => o.id));

//     while (optionIDs.length > 0) {
//       const curID = optionIDs.pop();
//       const curNode = options.find((o) => o.id === curID) as OptionN;
//       if (curNode.options) {
//         optionIDs.push(...curNode.options);
//       }
//       templateOptionsN.push(curNode);
//     }
//   }

//   const options = _getAllOptions(get);
//   const templateOptions = templateOptionsN.map(
//     (o) => options.find((option) => option.id === o.id) as Option,
//   );

//   return [initOptions, templateOptions];
// };

export const sanatizeStep = (step) => (step > 6 || step < 0 ? 0 : step);

export const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...userSlice(set, get),
        ...uiSlice(set, get),
        ...templateSlice(set, get),
        ...projectSlice(set, get),

        // systemTypes: getMockData()["systemTypes"],
        // templates: getMockData()["templates"],
        // options: getMockData()["options"],
        // getOptions: () => _getAllOptions(get),
        // getTemplates: (sort = sortByName) =>
        //   sort ? _getTemplates(get).sort(sort) : _getTemplates(get),
        // getTemplateOptions: (template: SystemTemplate) =>
        //   _getOptions(template, get),
      }),
      {
        name: "linkage-storage",
        version: SCHEMA_VERSION,
      },
    ),
  ),
);
