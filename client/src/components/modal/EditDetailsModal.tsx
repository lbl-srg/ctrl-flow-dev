// import { Field, Form, Formik } from "formik";
import Modal, { ModalInterface } from "./Modal";
import { useStores } from "../../data";
import { observer } from "mobx-react";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import { ProjectDetailInterface } from "../../data/project";
import {
  FlatConfigOption,
  FlatConfigOptionGroup,
  mapToDisplayOptions,
} from "../../interpreter/display-option";
import { projectContext } from "../../interpreter/interpreter";
import { getConfigValuesToSave } from "../../interpreter/config-values";
import OptionSelect from "../steps/Configs/OptionSelect";
import { useDebouncedCallback } from "use-debounce";
import { ALL_SYSTEMS, selectionKey } from "../../utils/selection-key";
import { ConfigValues, storedValue } from "../../utils/modifier-helpers";

// Climate zones are not displayed as "Not specified": only the zones of the
// selected energy standard are displayed
const ZONE_KEYS = ["ashCliZon", "tit24CliZon"].map((name) =>
  selectionKey(ALL_SYSTEMS, name),
);

const flatten = (
  items: (FlatConfigOptionGroup | FlatConfigOption)[],
): FlatConfigOption[] =>
  items.flatMap((item) => ("groupName" in item ? flatten(item.items) : item));

interface EditDetailsModalProps extends ModalInterface {
  afterSubmit?: () => void;
  modalTitle: string;
  submitText: string;
  cancelText?: string;
}

const EditDetailsModal = observer(
  ({
    afterSubmit,
    modalTitle,
    submitText,
    cancelText,
    isOpen,
    close,
  }: EditDetailsModalProps) => {
    const { configStore, projectStore, templateStore } = useStores();
    const details = projectStore.getProjectDetails();
    const allOptions = templateStore.getAllOptions();
    const [formInputs, setFormInputs] = useState({
      name: details?.name || "",
      address: details?.address || "",
      type: details?.type || "",
      size: details?.size || 0,
      notes: details?.notes || "",
    });
    const [selectedValues, setSelectedValues] = useState<ConfigValues>(
      projectStore.getProjectSelections(),
    );

    const context = projectContext(allOptions, selectedValues);
    const displayedOptions = flatten(mapToDisplayOptions(context)).map(
      (option) =>
        ZONE_KEYS.includes(option.selectionKey)
          ? {
              ...option,
              choices: option.choices?.filter(
                (choice) => choice.name !== "Not specified",
              ),
            }
          : option,
    );

    const updateTextInput = useDebouncedCallback(
      (
        event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
      ) => {
        setFormInputs((prevState: any) => {
          return {
            ...prevState,
            [event.target.name]: event.target.value,
          };
        });
      },
      500,
    );

    function updateSelectInput(event: ChangeEvent<HTMLSelectElement>) {
      setFormInputs((prevState: any) => {
        return {
          ...prevState,
          [event.target.name]: event.target.value,
        };
      });
    }

    function updateSelectedOption(
      option: FlatConfigOption,
      choice: string | boolean | null,
    ) {
      setSelectedValues((prevState: any) => {
        if (choice == null) {
          delete prevState[option.selectionKey];
          return prevState;
        }

        // The attributes of the value are set from the declaration
        return {
          ...prevState,
          [option.selectionKey]: storedValue(
            allOptions[option.modelicaPath],
            choice,
          ),
        };
      });
    }

    function save(ev: SyntheticEvent) {
      ev.preventDefault();
      ev.stopPropagation();
      // The selections of options that are not displayed, as the zone of
      // another energy standard, are discarded
      const { selections, evaluatedValues } = getConfigValuesToSave(
        context,
        selectedValues,
      );
      const newProjectDetails: ProjectDetailInterface = {
        ...formInputs,
        selections,
        evaluatedValues,
      };
      projectStore.setProjectDetails(newProjectDetails);
      // This removes all configs when saving project details.
      // The reason for this is we don't want the user to use saved configs with
      // changed project details as it will cause issues with evaluated values.
      configStore.removeAllForProject(projectStore.activeProjectId);
      if (afterSubmit) afterSubmit();
    }

    function renderAllSystemOptions() {
      return (
        <div className="grid">
          {displayedOptions.map((option) => {
            return (
              <label key={option.name}>
                <OptionSelect
                  key={`${option.parentModelicaPath}---${option.modelicaPath}`}
                  option={option}
                  updateSelectedOption={updateSelectedOption}
                />
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <Modal close={close} isOpen={isOpen}>
        <h1>{modalTitle}</h1>

        <form className="no-margin" onSubmit={save}>
          {/*<label htmlFor="name">
            {itl.phrases.projectName}:
            <input name="name" type="text" onChange={updateTextInput} defaultValue={formInputs.name} />
          </label>

          <label htmlFor="address">
            Address:
            <input name="address" type="text" onChange={updateTextInput} defaultValue={formInputs.address} />
          </label>

          <div className="grid">
            <label htmlFor="type">
              {itl.terms.type}
              <select
                name="type"
                data-testid="type-input"
                onChange={updateSelectInput}
                defaultValue={formInputs.type}
              >
                <option value="multi-story office">Multi-Story Office</option>
                <option value="warehouse">Warehouse</option>
                <option value="something else">Something Else</option>
              </select>
            </label>

            <label htmlFor="size">
              {itl.terms.size}
              <input
                id="size"
                type="number"
                name="size"
                onChange={updateTextInput}
                defaultValue={formInputs.size}
              />
            </label>*/}

          {/*<div className="grid">
            <label htmlFor="units">
              {itl.terms.units}
              <select
                name="units"
                data-testid="units-input"
                onChange={updateSelectInput}
                defaultValue={formInputs.units}
              >
                <option value="IP">IP</option>
                <option value="SI">SI</option>
              </select>
            </label>
          </div>*/}

          {renderAllSystemOptions()}

          {/*<label htmlFor="notes">{itl.terms.notes}:</label>
          <textarea name="notes"  onChange={updateTextInput} defaultValue={formInputs.notes} />*/}

          <div className="action-bar">
            {cancelText ? (
              <button onClick={close} className="inline outline small">
                {cancelText}
              </button>
            ) : null}
            <input type="submit" className="inline" value={submitText} />
          </div>
        </form>
      </Modal>
    );
  },
);

export default EditDetailsModal;
