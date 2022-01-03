import create from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectDetails {
  name: string;
  address: string;
  type: "multi-story office" | "warehouse" | "something else";
  size: number;
  units: "ip" | "something";
  code: "ashrae 90.1 20201" | "a different one";
  notes: string;
}

export interface State {
  currentStep: number;
  incrementStep: () => void;
  decrementStep: () => void;
  jumpToStep: (step: number) => void;

  projectDetails: Partial<ProjectDetails>;
  saveProjectDetails: (projectDetails: Partial<ProjectDetails>) => void;
}

export const useStore = create<State>(
  persist(
    (set, get) => ({
      currentStep: 0,
      incrementStep: () =>
        set(() => ({
          currentStep: sanatizeStep(get().currentStep + 1),
        })),
      decrementStep: () =>
        set(() => ({ currentStep: sanatizeStep(get().currentStep - 1) })),
      jumpToStep: (step: number) => set({ currentStep: sanatizeStep(step) }),

      projectDetails: {},
      saveProjectDetails: (projectDetails: Partial<ProjectDetails>) =>
        set(() => ({ projectDetails })),
    }),
    {
      name: "linkage-storage",
    },
  ),
);

export const sanatizeStep = (step: number) => (step > 6 || step < 0 ? 0 : step);
