import { Field, Form, Formik } from "formik";
import { ProjectDetails, useStore } from "../../store/store";
import Modal, { ModalInterface } from "./Modal";

interface EditDetailsModalProps extends ModalInterface {
  afterSubmit?: () => void;
  initialState?: Partial<ProjectDetails>;
  modalTitle: string;
  submitText: string;
}

const defaultState = {
  name: "",
  address: "",
  type: "",
  size: 0,
  units: "",
  code: "",
  notes: "",
} as unknown as ProjectDetails;

function EditDetailsModal({
  afterSubmit,
  initialState = defaultState,
  modalTitle,
  submitText,
  isOpen,
  close,
}: EditDetailsModalProps) {
  const { saveProjectDetails } = useStore((state) => state);

  return (
    <Modal close={close} isOpen={isOpen}>
      <h1>{modalTitle}</h1>

      <Formik
        initialValues={initialState}
        onSubmit={(values: Partial<ProjectDetails>) => {
          saveProjectDetails(values);
          afterSubmit && afterSubmit();
        }}
      >
        <Form className="no-margin">
          <label htmlFor="name">
            Project Name:
            <Field id="name" name="name" />
          </label>

          <label htmlFor="address">
            Address:
            <Field id="address" name="address" />
          </label>

          <div className="grid">
            <label htmlFor="type">
              Type
              <Field as="select" name="type" data-testid="type-input">
                <option value="multi-story office">Multi-Story Office</option>
                <option value="warehouse">Warehouse</option>
                <option value="something else">Something Else</option>
              </Field>
            </label>

            <label htmlFor="size">
              Size
              <Field id="size" type="number" name="size" />
            </label>

            <label htmlFor="units">
              Units
              <Field as="select" name="units" data-testid="units-input">
                <option value="ip">IP</option>
                <option value="something">Something</option>
              </Field>
            </label>

            <label htmlFor="code">
              Energy Code
              <Field as="select" name="code" data-testid="code-input">
                <option value="ashrae 90.1 20201">ASHRAE 90.1 20201</option>
                <option value="a different one">A Different One</option>
              </Field>
            </label>
          </div>

          <label htmlFor="notes">Notes:</label>
          <Field as="textarea" id="notes" name="notes" />

          <div className="action-bar">
            <input type="submit" className="inline" value={submitText} />
          </div>
        </Form>
      </Formik>
    </Modal>
  );
}

export default EditDetailsModal;
