/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, useState } from "react";
import { colors } from "../../styleHelpers";
import Button, { ButtonProps } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

interface EditDetailsModalProps {
  modalTitle: string;
}

const EditDetailsModal = ({
  modalTitle,
  ...props
}: EditDetailsModalProps & ButtonProps) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        <Button onClick={() => setOpen(true)} {...props}>
          Create New Project
        </Button>
        <BaseModal closeAction={() => setOpen(false)}>
          <h1>{modalTitle}</h1>
        </BaseModal>
      </Fragment>
    </ModalOpenContext.Provider>
  );
};

export default EditDetailsModal;
