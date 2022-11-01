import { useStores } from "../data";

export const storeHooks = () => {
  const { templateStore } = useStores();

  const getAllOptions = (): any => {
    return templateStore.getAllOptions();
  }

  const getTemplateOption = (modelicaPath: string): any => {
    return templateStore.getOption(modelicaPath);
  };

  const isDefinition = (modelicaPath: string): boolean => {
    return templateStore.getOption(modelicaPath)?.definition || false;
  }

  return {getAllOptions, getTemplateOption, isDefinition};
}