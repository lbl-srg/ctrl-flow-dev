// import { Field, Form, Formik } from "formik";
import Modal, { ModalInterface } from "./Modal";
import itl from "../../translations";
import { useStores } from "../../data";
import { getFormData } from "../../utils/dom-utils";
import { observer } from "mobx-react";
import { SyntheticEvent } from "react";

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

    const details = projectStore.activeProject.projectDetails;

    function save(ev: SyntheticEvent) {
      ev.preventDefault();
      ev.stopPropagation();
      projectStore.setProjectDetails(getFormData(ev.target as HTMLFormElement));
      if (afterSubmit) afterSubmit();
    }

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
                <option value="square feet">square ft</option>
                <option value="something">Something</option>
              </select>
            </label>

            <label htmlFor="code">
              {itl.phrases.energyCode}
              <select
                name="code"
                data-testid="code-input"
                defaultValue={details.code}
              >
                <option value="ashrae 90.1 20201">ASHRAE 90.1 20201</option>
                <option value="a different one">A Different One</option>
              </select>
            </label>
          </div>

          <label htmlFor="notes">{itl.terms.notes}:</label>
          <textarea name="notes" defaultValue={details.notes}></textarea>

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
