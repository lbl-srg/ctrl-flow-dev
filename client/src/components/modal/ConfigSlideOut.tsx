/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, ReactNode, useState } from "react";

import Button, { LinkButton } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

import { Configuration, System } from "../../store/store"

interface SlideOutProps {
  template: System;
  config?: Configuration;
  variant: "text" | "button";
  children?: ReactNode;
}

const SlideOut = ({variant, template, config, ...props}: SlideOutProps) => {
  const [isOpen, setOpen] = useState(false);
    const openButton = variant === "text" ? <LinkButton to="" variant="link" onClick={() => setOpen(true)} {...props}/>
            : <Button onClick={() => setOpen(true)} {...props}/>

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        {openButton}
        <BaseModal
          closeAction={() => setOpen(false)}
          showCloseButton={false}
          css={slideOutCss}
        >
          <h1>Hello World</h1>
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
