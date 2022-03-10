import { SetState, GetState } from "zustand";
import { State, SystemTemplate } from "../store";
import { produce } from "immer";

export interface uiSliceInterface {
  setLeftColWidth: (width: number) => void;
  setActiveTemplate: (template: SystemTemplate) => void;
  getActiveTemplate: () => SystemTemplate | undefined;
  leftColWidth: number;
  activeTemplate: number | null;
}

export default function (
  set: SetState<State>,
  get: GetState<State>,
): uiSliceInterface {
  return {
    leftColWidth: 300,
    activeTemplate: null,
    setLeftColWidth: (width) => {
      set(
        produce((state: State) => {
          state.leftColWidth = width;
        }),
      );
    },
    setActiveTemplate: (template) => set({ activeTemplate: template?.id }),
    getActiveTemplate: () =>
      get()
        .getTemplates()
        .find((t) => t.id === get().activeTemplate),
  };
}
