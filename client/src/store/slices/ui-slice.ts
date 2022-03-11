import { SetState, GetState } from "zustand";
import { State, SystemTemplate } from "../store";
import { produce } from "immer";

export interface uiSliceInterface {
  leftColWidth: number;
  setLeftColWidth: (width: number) => void;

  activeTemplateId: number | null;
  setActiveTemplateId: (activeTemplateId: number | null) => void;
  getActiveTemplate: () => SystemTemplate | undefined;

  setActiveSystemId: (activeSystemId: number) => void;
  activeSystemId: number | null;

  timeoutScroll: () => void;
  watchScroll: boolean;
}

export default function (
  set: SetState<State>,
  get: GetState<State>,
): uiSliceInterface {
  return {
    watchScroll: false,
    timeoutScroll: () => {
      set({ watchScroll: false });

      setTimeout(() => {
        set({ watchScroll: true });
      }, 1000);
    },
    activeSystemId: null,
    setActiveSystemId: (activeSystemId) => set({ activeSystemId }),
    activeTemplateId: null,
    setActiveTemplateId: (activeTemplateId) => set({ activeTemplateId }),

    leftColWidth: 300,
    setLeftColWidth: (width) => {
      set(
        produce((state: State) => {
          state.leftColWidth = width;
        }),
      );
    },

    getActiveTemplate: () =>
      get()
        .getTemplates()
        .find(({ id }) => id === get().activeTemplateId),
  };
}
