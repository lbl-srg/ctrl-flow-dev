/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, ReactNode, useState } from "react";

import Button, { LinkButton } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

import { useStore, Configuration, System, State } from "../../store/store"

interface SlideOutProps {
  template: System;
  config?: Configuration;
}

const SlideOut = ({template, config}: SlideOutProps) => {
  const [isOpen, setOpen] = useState(false);
  const { options } = useStore(state => ({ options: state.templates.options }));
  const systemOptions = template.options ? template.options.map(optionId => options.find(o => o.id === optionId)) : [];

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        <Button onClick={() => setOpen(true)}>Edit</Button>
        <BaseModal
          closeAction={() => setOpen(false)}
          showCloseButton={false}
          css={slideOutCss}
        >
          <h1>{template.name}</h1>
        </BaseModal>
      </Fragment>
    </ModalOpenContext.Provider>
  );
};

const slideOutCss = css`
  right: 0; // force pane to the right hand side
  top: 0; // force pane to the top
  margin: 0; // reset the margin
  height: 100vh;
  width: 28rem;
`;

export default SlideOut;
