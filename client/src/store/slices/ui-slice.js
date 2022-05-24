export default function (set, get) {
  return {
    watchScroll: false,
    timeoutScroll: () => {
      set({ watchScroll: false });

      setTimeout(() => {
        set({ watchScroll: true });
      }, 1000);
    },
    activeSystemPath: null,
    setActiveSystemPath: (activeSystemPath) => set({ activeSystemPath }),

    openSystemPath: null,
    setOpenSystemPath: (openSystemPath) => set({ openSystemPath }),

    activeTemplatePath: null,
    setActiveTemplatePath: (activeTemplatePath) => set({ activeTemplatePath }),

    activeConfigPath: null,
    setActiveConfigPath: (activeConfigPath) => set({ activeConfigPath }),

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
