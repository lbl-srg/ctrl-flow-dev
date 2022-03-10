import { SetState, GetState } from "zustand";
import { State, SystemTemplate } from "../store";
import { produce } from "immer";

export interface uiSliceInterface {
  setLeftColWidth: (width: number) => void;
  setActiveTemplate: (template: SystemTemplate | null) => void;
  getActiveTemplate: () => SystemTemplate | undefined;
  setActiveSystemId: (id: number) => void;
  activeSystemId: number | null;
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
    activeSystemId: null,
    setLeftColWidth: (width) => {
      set(
        produce((state: State) => {
          state.leftColWidth = width;
        }),
      );
    },
    setActiveSystemId: (id) => set({ activeSystemId: id }),
    setActiveTemplate: (template) =>
      set({ activeTemplate: template?.id || null }),
    getActiveTemplate: () =>
      get()
        .getTemplates()
        .find((t) => t.id === get().activeTemplate),
  };
}
