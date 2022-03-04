import { SetState, GetState } from "zustand";
import { State } from "../store";
import { produce } from "immer";

export interface uiSliceInterface {
  setLeftColWidth: (width: number) => void;
  leftColWidth: number;
}

export default function (
  set: SetState<State>,
  get: GetState<State>,
): uiSliceInterface {
  return {
    leftColWidth: 300,

    setLeftColWidth: (width) => {
      set(
        produce((state: State) => {
          state.leftColWidth = width;
        }),
      );
    },
  };
}
