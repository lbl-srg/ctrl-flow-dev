// import { Field, Form, Formik } from "formik";
import Modal, { ModalInterface } from "./Modal";
import itl from "../../translations";
import { useStores } from "../../data";
import { getFormData } from "../../utils/dom-utils";
import { observer } from "mobx-react";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import { ProjectDetailInterface, ProjectInterface } from "../../data/project";

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
    const { projectStore } = useStores();

    const activeProject = projectStore.activeProject as ProjectInterface;
    const details = activeProject.projectDetails;

    const [selectedEnergy, setSelectedEnergy] = useState(details.energy);

    function onEnergyChange(event: ChangeEvent<HTMLSelectElement>) {
      setSelectedEnergy(event.target.value);
    }

    function save(ev: SyntheticEvent) {
      ev.preventDefault();
      ev.stopPropagation();
      projectStore.setProjectDetails(
        getFormData(ev.target as HTMLFormElement) as ProjectDetailInterface,
      );
      if (afterSubmit) afterSubmit();
    }

    //TODO: Energy/Ventilation Standards and Climate Zones need to be pulled in options

    return (
      <Modal close={close} isOpen={isOpen}>
        <h1>{modalTitle}</h1>

        <form className="no-margin" onSubmit={save}>
          <label htmlFor="name">
            {itl.phrases.projectName}:
            <input name="name" type="text" defaultValue={details.name} />
          </label>

          <label htmlFor="address">
            Address:
            <input name="address" type="text" defaultValue={details.address} />
          </label>

          <div className="grid">
            <label htmlFor="type">
              {itl.terms.type}
              <select
                name="type"
                data-testid="type-input"
                defaultValue={details.type}
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
                defaultValue={details.size}
              />
            </label>

            <label htmlFor="units">
              {itl.terms.units}
              <select
                name="units"
                data-testid="units-input"
                defaultValue={details.units}
              >
                <option value="ip">IP</option>
                <option value="si">SI</option>
              </select>
            </label>
          </div>

          <div className="grid">
            <label htmlFor="energy">
              {itl.phrases.energyStandard}
              <select
                name="energy"
                data-testid="energy-input"
                defaultValue={details.energy}
                onChange={onEnergyChange}
              >
                <option value="Not specified">Not specified</option>
                <option value="ASHRAE 90.1-2016 energy code">
                  ASHRAE 90.1-2016 energy code
                </option>
                <option value="California Title 24-2016">
                  California Title 24-2016
                </option>
              </select>
            </label>

            <label htmlFor="ventilation">
              {itl.phrases.ventilationStandard}
              <select
                name="ventilation"
                data-testid="ventilation-input"
                defaultValue={details.ventilation}
              >
                <option value="Not specified">Not specified</option>
                <option value="ASHRAE 62.1-2016 ventilation code">
                  ASHRAE 62.1-2016 ventilation code
                </option>
                <option value="California Title 24-2016">
                  California Title 24-2016
                </option>
              </select>
            </label>

            {selectedEnergy === "ASHRAE 90.1-2016 energy code" && (
              <label htmlFor="ashraeZone">
                {itl.phrases.ashraeZone}
                <select
                  name="ashraeZone"
                  data-testid="ashraeZone-input"
                  defaultValue={details.ashraeZone}
                >
                  <option value="Not specified">Not specified</option>
                  <option value="Zone 1A, Very Hot and Humid">
                    Zone 1A, Very Hot and Humid
                  </option>
                  <option value="Zone 1B, Very Hot and Dry">
                    Zone 1B, Very Hot and Dry
                  </option>
                  <option value="Zone 2A, Hot and Humid">
                    Zone 2A, Hot and Humid
                  </option>
                  <option value="Zone 2B, Hot and Dry">
                    Zone 2B, Hot and Dry
                  </option>
                  <option value="Zone 3A, Warm and Humid">
                    Zone 3A, Warm and Humid
                  </option>
                  <option value="Zone 3B, Warm and Dry">
                    Zone 3B, Warm and Dry
                  </option>
                  <option value="Zone 3C, Warm and Marine">
                    Zone 3C, Warm and Marine
                  </option>
                  <option value="Zone 4A, Mixed and Humid">
                    Zone 4A, Mixed and Humid
                  </option>
                  <option value="Zone 4B, Mixed and Dry">
                    Zone 4B, Mixed and Dry
                  </option>
                  <option value="Zone 4C, Mixed and Marine">
                    Zone 4C, Mixed and Marine
                  </option>
                  <option value="Zone 5A, Cool and Humid">
                    Zone 5A, Cool and Humid
                  </option>
                  <option value="Zone 5B, Cool and Dry">
                    Zone 5B, Cool and Dry
                  </option>
                  <option value="Zone 5C, Cool and Marine">
                    Zone 5C, Cool and Marine
                  </option>
                  <option value="Zone 6A, Cold and Humid">
                    Zone 6A, Cold and Humid
                  </option>
                  <option value="Zone 6B, Cold and Dry">
                    Zone 6B, Cold and Dry
                  </option>
                  <option value="Zone 7, Very Cold">Zone 7, Very Cold</option>
                  <option value="Zone 8, Subarctic">Zone 8, Subarctic</option>
                </select>
              </label>
            )}

            {selectedEnergy === "California Title 24-2016" && (
              <label htmlFor="californiaZone">
                {itl.phrases.californiaZone}
                <select
                  name="californiaZone"
                  data-testid="californiaZone-input"
                  defaultValue={details.californiaZone}
                >
                  <option value="Not specified">Not specified</option>
                  <option value="Zone 1, Reference city: Eureka">
                    Zone 1, Reference city: Eureka
                  </option>
                  <option value="Zone 2, Reference city: Napa">
                    Zone 2, Reference city: Napa
                  </option>
                  <option value="Zone 3, Reference city: San Francisco">
                    Zone 3, Reference city: San Francisco
                  </option>
                  <option value="Zone 4, Reference city: San Jose">
                    Zone 4, Reference city: San Jose
                  </option>
                  <option value="Zone 5, Reference city: Santa Maria">
                    Zone 5, Reference city: Santa Maria
                  </option>
                  <option value="Zone 6, Reference city: Los Angeles">
                    Zone 6, Reference city: Los Angeles
                  </option>
                  <option value="Zone 7, Reference city: San Diego">
                    Zone 7, Reference city: San Diego
                  </option>
                  <option value="Zone 8, Reference city: Long Beach">
                    Zone 8, Reference city: Long Beach
                  </option>
                  <option value="Zone 9, Reference city: Los Angeles (Civic Center)">
                    Zone 9, Reference city: Los Angeles (Civic Center)
                  </option>
                  <option value="Zone 10, Reference city: Riverside">
                    Zone 10, Reference city: Riverside
                  </option>
                  <option value="Zone 11, Reference city: Red Bluff">
                    Zone 11, Reference city: Red Bluff
                  </option>
                  <option value="Zone 12, Reference city: Stockton">
                    Zone 12, Reference city: Stockton
                  </option>
                  <option value="Zone 13, Reference city: Fresno">
                    Zone 13, Reference city: Fresno
                  </option>
                  <option value="Zone 14, Reference city: Barstow">
                    Zone 14, Reference city: Barstow
                  </option>
                  <option value="Zone 15, Reference city: Brawley">
                    Zone 15, Reference city: Brawley
                  </option>
                  <option value="Zone 16, Reference city: Bishop">
                    Zone 16, Reference city: Bishop
                  </option>
                </select>
              </label>
            )}
          </div>

          <label htmlFor="notes">{itl.terms.notes}:</label>
          <textarea name="notes" defaultValue={details.notes} />

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
