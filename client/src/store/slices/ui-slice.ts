import { SetState, GetState } from "zustand";
import { State, SystemTemplate } from "../store";
import { produce } from "immer";
import { ConfigFormValues } from "../../utils/FormHelpers";
import { Configuration } from "./user-slice";

export interface uiSliceInterface {
  leftColWidth: number;
  setLeftColWidth: (width: number) => void;

  activeTemplateId: number | null;
  setActiveTemplateId: (activeTemplateId: number | null) => void;
  getActiveTemplate: () => SystemTemplate | undefined;

  setActiveSystemId: (activeSystemId: number) => void;
  activeSystemId: number | null;

  setActiveConfigId: (activeConfigId: number) => void;
  activeConfigId: number | null;

  timeoutScroll: () => void;
  watchScroll: boolean;

  getActiveConfig: () => Configuration | undefined;
  clearNavState: () => void;
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

    activeConfigId: null,
    setActiveConfigId: (activeConfigId) => set({ activeConfigId }),

    leftColWidth: 300,
    setLeftColWidth: (leftColWidth) => set({ leftColWidth }),

    clearNavState: () => {
      set({
        activeTemplateId: null,
        activeSystemId: null,
        activeConfigId: null,
      });
    },

    getActiveConfig: () => {
      return get()
        .getConfigs()
        .find(({ id }) => id === get().activeConfigId);
    },

    getActiveTemplate: () =>
      get()
        .getTemplates()
        .find(({ id }) => id === get().activeTemplateId),
  };
}
