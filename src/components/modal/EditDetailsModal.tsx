/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import styled from "@emotion/styled";
import { Field, Form, Formik } from "formik";
import { Fragment, ReactNode, useState } from "react";
import { ProjectDetails, useStore } from "../../store/store";
import Button, { ButtonProps } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

interface EditDetailsModalProps {
  afterSubmit?: () => void;
  children: ReactNode;
  initialState?: Partial<ProjectDetails>;
  modalTitle: string;
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

const EditDetailsModal = ({
  afterSubmit,
  children,
  initialState = defaultState,
  modalTitle,
  submitText,
  ...props
}: EditDetailsModalProps & ButtonProps) => {
  const { saveProjectDetails } = useStore((state) => ({
    projectDetails: state.projectDetails,
    saveProjectDetails: state.saveProjectDetails,
    incrementStep: state.incrementStep,
  }));
  const [isOpen, setOpen] = useState(false);

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        <Button onClick={() => setOpen(true)} {...props}>
          {children}
        </Button>
        <BaseModal closeAction={() => setOpen(false)}>
          <h1>{modalTitle}</h1>
          <Formik
            initialValues={initialState}
            onSubmit={(values: Partial<ProjectDetails>) => {
              saveProjectDetails(values);
              setOpen(false);
              afterSubmit && afterSubmit();
            }}
          >
            <Form
              css={css`
                width: 100% height 100%;
              `}
            >
              <Label htmlFor="name">Project Name:</Label>
              <Field id="name" name="name" />

              <Label htmlFor="address">Address:</Label>
              <Field id="address" name="address" />

              <Label htmlFor="type">Type</Label>
              <Field as="select" name="type" data-testid="type-input">
                <option value="multi-story office">Multi-Story Office</option>
                <option value="warehouse">Warehouse</option>
                <option value="something else">Something Else</option>
              </Field>

              <Label htmlFor="size">Size</Label>
              <Field id="size" type="number" name="size" />

              <Label htmlFor="units">Units</Label>
              <Field as="select" name="units" data-testid="units-input">
                <option value="ip">IP</option>
                <option value="something">Something</option>
              </Field>

              <Label htmlFor="code">Energy Code</Label>
              <Field as="select" name="code" data-testid="code-input">
                <option value="ashrae 90.1 20201">ASHRAE 90.1 20201</option>
                <option value="a different one">A Different One</option>
              </Field>

              <Label htmlFor="notes">Notes:</Label>
              <Field as="textarea" id="notes" name="notes" />

              <Button
                type="submit"
                css={css`
                  position: absolute;
                  bottom: 3rem;
                  right: 6rem;
                `}
              >
                {submitText}
              </Button>
            </Form>
          </Formik>
        </BaseModal>
      </Fragment>
    </ModalOpenContext.Provider>
  );
};

const Label = styled.label`
  display: block;
  font-weight: bold;
`;

export default EditDetailsModal;
