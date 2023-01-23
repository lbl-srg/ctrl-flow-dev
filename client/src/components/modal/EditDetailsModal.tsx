// import { Field, Form, Formik } from "formik";
import Modal, { ModalInterface } from "./Modal";
import itl from "../../translations";
import { useStores } from "../../data";
import { getFormData } from "../../utils/dom-utils";
import { observer } from "mobx-react";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import { ProjectDetailInterface } from "../../data/project";
import { OptionInterface } from "../../data/template";
import { FlatConfigOption } from "../steps/Configs/SlideOut";
import OptionSelect from "../steps/Configs/OptionSelect";
import { useDebouncedCallback } from "use-debounce";
import { removeEmpty } from "../../utils/utils";
import {
  SystemTypeInterface,
  TemplateInterface
} from "../../data/template";

import {
  applyValueModifiers,
  applyVisibilityModifiers,
  Modifiers,
  ConfigValues,
} from "../../utils/modifier-helpers";

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
    const projectOptions = templateStore.getOptionsForProject();
    const allOptions = templateStore.getAllOptions();
    const [formInputs, setFormInputs] = useState({
      name: details?.name || '',
      address: details?.address || '',
      type: details?.type || '',
      size: details?.size || 0,
      notes: details?.notes || '',
    });
    const [selectedValues, setSelectedValues] = useState<ConfigValues>(
      projectStore.getProjectSelections()
    );

    const evaluatedValues = getEvaluatedValues(projectOptions);
    const displayedOptions = getDisplayOptions(projectOptions, 'root');

    function getEvaluatedValues(
      options: OptionInterface[],
    ): ConfigValues {
      let evaluatedValues: ConfigValues = {};

      options.forEach((option) => {
        const selectionPath = option.modelicaPath;

        evaluatedValues = {
          ...evaluatedValues,
          [selectionPath]: applyValueModifiers(
            option?.value,
            "",
            selectionPath,
            selectedValues,
            {},
            {},
            allOptions,
          ),
        };

        if (option.childOptions?.length) {
          evaluatedValues = {
            ...evaluatedValues,
            ...getEvaluatedValues(
              option.childOptions,
            ),
          };
        }
      });

      return evaluatedValues;
    }

    function getDisplayOptions(
      options: OptionInterface[],
      parentModelicaPath: string,
    ): FlatConfigOption[] {
      const removeNotSpecifiedList = [
        'Buildings.Templates.Data.AllSystems.ashCliZon',
        'Buildings.Templates.Data.AllSystems.tit24CliZon'
      ];
      let displayOptions: FlatConfigOption[] = [];

      options.forEach((option) => {
        const selectionPath = option.modelicaPath;
        const isVisible = applyVisibilityModifiers(
          option,
          "",
          selectedValues,
          {},
          {},
          allOptions,
        );

        if (isVisible && option.childOptions?.length) {
          const modifiedChildOptions = removeNotSpecifiedList.includes(option.modelicaPath)
            ? option.childOptions.filter((opt) => opt.name !== 'Not specified')
            : option.childOptions;

          displayOptions = [
            ...displayOptions,
            {
              parentModelicaPath,
              modelicaPath: option.modelicaPath,
              name: option.name,
              choices: modifiedChildOptions || [],
              value:
                selectedValues[selectionPath] || evaluatedValues[selectionPath],
              scope: "",
              selectionType: "Normal",
            },
          ];

          if (selectedValues[selectionPath]) {
            const selectedOption = allOptions[
              selectedValues[selectionPath]
            ] as OptionInterface;

            if (selectedOption) {
              displayOptions = [
                ...displayOptions,
                ...getDisplayOptions(
                  [selectedOption],
                  option.modelicaPath,
                ),
              ];
            }
          } else if (evaluatedValues[selectionPath]) {
            const evaluatedOption = allOptions[
              evaluatedValues[selectionPath]
            ] as OptionInterface;

            if (evaluatedOption) {
              displayOptions = [
                ...displayOptions,
                ...getDisplayOptions(
                  [evaluatedOption],
                  option.modelicaPath,
                ),
              ];
            }
          }
        } else if (option.childOptions?.length) {
          displayOptions = [
            ...displayOptions,
            ...getDisplayOptions(
              option.childOptions,
              option.modelicaPath,
            ),
          ];
        }
      });

      return displayOptions;
    }

    const updateTextInput = useDebouncedCallback(
      (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
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
    };

    function updateSelectedOption(
      parentModelicaPath: string,
      scope: string,
      choice: string | null,
    ) {
      setSelectedValues((prevState: any) => {
        const selectionPath = parentModelicaPath;

        if (choice == null) {
          delete prevState[selectionPath];
          return prevState;
        }

        return {
          ...prevState,
          [selectionPath]: choice,
        };
      });
    }

    // TODO: There needs to be a cleaner way to delete the zone that is not associated to the energy standard
    // This was done due to time and was a bug found last min.
    function adjustProjectSelections() {
      const projectSelectedItems = selectedValues;
      const energyStandard = projectSelectedItems['Buildings.Templates.Data.AllSystems.stdEne'];

      if (
        energyStandard === 'Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1' &&
        projectSelectedItems['Buildings.Templates.Data.AllSystems.tit24CliZon']
      ) {
        delete projectSelectedItems['Buildings.Templates.Data.AllSystems.tit24CliZon'];
      }

      if (
        energyStandard === 'Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.California_Title_24' &&
        projectSelectedItems['Buildings.Templates.Data.AllSystems.ashCliZon']
      ) {
        delete projectSelectedItems['Buildings.Templates.Data.AllSystems.ashCliZon'];
      }

      return projectSelectedItems;
    }

    function save(ev: SyntheticEvent) {
      ev.preventDefault();
      ev.stopPropagation();
      const newProjectDetails: ProjectDetailInterface = {
        ...formInputs,
        selections: adjustProjectSelections(),
        evaluatedValues: removeEmpty(evaluatedValues),
      };
      projectStore.setProjectDetails(newProjectDetails);
      // This removes all configs when saving project details.
      // The reason for this is we don't want the user to use saved configs with
      // changed project details as it will cause issues with evaluated values.
      templateStore.systemTypes.forEach((systemType: SystemTypeInterface) => {
        const templates = templateStore.getTemplatesForSystem(systemType.modelicaPath);

        templates.forEach((option: TemplateInterface) => {
          configStore.removeAllForSystemTemplate(systemType.modelicaPath, option.modelicaPath);
        });
      });
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
            )
          })}
        </div>
      )
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
