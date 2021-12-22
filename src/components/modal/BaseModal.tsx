/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import styled from "@emotion/styled";
import { createContext, Fragment, ReactNode } from "react";
import Modal, { ModalProps } from "react-overlays/Modal";
import { colors, dropShadow, fonts } from "../../styleHelpers";
import Button from "../Button";

export const ModalOpenContext = createContext(false);

interface BaseModalProps {
  closeAction: () => void;
  children: ReactNode;
}

export const BaseModal = ({ closeAction, children }: BaseModalProps) => (
  <ModalOpenContext.Consumer>
    {(showModal) => (
      <StyledModal
        show={showModal}
        renderBackdrop={(props) => <Backdrop {...props} />}
        onHide={() => closeAction()}
      >
        <Fragment>
          <Button
            variant="link"
            css={css`
              color: ${colors.darkGrey};
              font-size: 2rem;
              position: absolute;
              top: 0.25rem;
              right: 0;
            `}
            onClick={() => closeAction()}
          >
            ✕
          </Button>
          {children}
        </Fragment>
      </StyledModal>
    )}
  </ModalOpenContext.Consumer>
);

const StyledModal = styled(Modal)`
  position: fixed;
  z-index: 1000;
  width: 60rem;
  margin-left: -32rem;
  height: 40rem;
  margin-top: -22rem;
  top: 50%;
  left: 50%;
  padding: 2rem 4rem;
  background: ${colors.white};
  ${dropShadow}
  ${fonts}
`;

const Backdrop = styled.div`
  position: fixed;
  z-index: 1000;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${colors.black};
  opacity: 0.5;
`;
