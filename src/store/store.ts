import create from "zustand";
import { persist } from "zustand/middleware";

interface State {
  currentStep: number;
  incementStep: () => void;
  decrementStep: () => void;
  jumpToStep: (step: number) => void;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      currentStep: 0,
      incementStep: () =>
        set(() => ({
          currentStep: sanatizeStep(get().currentStep + 1),
        })),
      decrementStep: () =>
        set(() => ({ currentStep: sanatizeStep(get().currentStep - 1) })),
      jumpToStep: (step: number) => set({ currentStep: sanatizeStep(step) }),
    }),
    {
      name: "linkage-storage",
    },
  ),
);

const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
