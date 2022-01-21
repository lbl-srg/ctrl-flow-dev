/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, useState } from "react";

import Button from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

const SlideOut = () => {
  const [isOpen, setOpen] = useState(false);

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        <Button onClick={() => setOpen(true)}>Edit</Button>
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
