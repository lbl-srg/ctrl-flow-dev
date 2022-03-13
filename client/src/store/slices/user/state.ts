/**
 * Store slice containing actions and storage for user generated data
 *
 * TODO: clean up use of the zustand 'get()' and immer 'state'. Anytime there is a state update,
 * the 'state' object must be used to find what is being updated and not the zustand 'get()'
 *
 * Zustand freezes (makes read only) items returned from a 'get()' and does not allow updates
 */

import { SetState, GetState } from "zustand";
import {
  State,
  Option,
  SystemTemplate,
  GetAction,
  SetAction,
} from "../../store";
import { produce } from "immer";

import {
  UserProject,
  UserProjectN,
  ProjectDetails,
  Configuration,
  ConfigurationN,
  UserSystem,
  UserSystemN,
  MetaConfiguration,
  UserSliceInterface,
} from "./Types";

import { deduplicate, sortByName } from "../../../utils/utils";

// TODO... get a better uid system
let _incriment = 0;
function getID(): number {
  _incriment++;
  return Math.floor(Math.random() * 1000000000 + _incriment);
}
const initialUserProject: UserProjectN = {
  configs: [],
  userSystems: [],
  projectDetails: {},
  id: getID(),
};

export default function (
  set: SetState<State>,
  get: GetState<State>,
): UserSliceInterface {
  return {
    activeProject: initialUserProject.id,
    userProjects: [initialUserProject],
    userSystems: [],
    configurations: [],
  };
}
