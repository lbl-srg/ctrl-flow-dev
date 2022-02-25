import { Field, Form, Formik } from "formik";
import { ProjectDetails, useStore } from "../../store/store";

import Modal, { ModalInterface } from "./Modal";

interface EditDetailsModalProps extends ModalInterface {
  afterSubmit?: () => void;
  initialState?: Partial<ProjectDetails>;
  submitText: string;
}

const defaultState = {
  name: "",
  address: "",
  type: "multi-story office",
  size: "",
  units: "ip",
  code: "ashrae 90.1 20201",
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
  const { saveProjectDetails } = useStore((state) => ({
    saveProjectDetails: state.saveProjectDetails,
  }));

  return (
    <Modal modalTitle={modalTitle} close={close} isOpen={isOpen}>
      <Formik
        initialValues={initialState}
        onSubmit={(values: Partial<ProjectDetails>) => {
          saveProjectDetails(values);
          afterSubmit && afterSubmit();
        }}
      >
        <Form>
          <label htmlFor="name">Project Name:</label>
          <Field id="name" name="name" />

          <label htmlFor="address">Address:</label>
          <Field id="address" name="address" />

          <label htmlFor="type">Type</label>
          <Field as="select" name="type" data-testid="type-input">
            <option value="multi-story office">Multi-Story Office</option>
            <option value="warehouse">Warehouse</option>
            <option value="something else">Something Else</option>
          </Field>

          <label htmlFor="size">Size</label>
          <Field id="size" type="number" name="size" />

          <label htmlFor="units">Units</label>
          <Field as="select" name="units" data-testid="units-input">
            <option value="ip">IP</option>
            <option value="something">Something</option>
          </Field>

          <label htmlFor="code">Energy Code</label>
          <Field as="select" name="code" data-testid="code-input">
            <option value="ashrae 90.1 20201">ASHRAE 90.1 20201</option>
            <option value="a different one">A Different One</option>
          </Field>

          <label htmlFor="notes">Notes:</label>
          <Field as="textarea" id="notes" name="notes" />

          <input type="submit" value={submitText} />
        </Form>
      </Formik>
    </Modal>
  );
}

export default EditDetailsModal;
