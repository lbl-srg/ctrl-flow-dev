import { ReactNode } from "react";

export interface ModalInterface {
  modalTitle: string;
  isOpen: boolean;
  close: () => void;
  children?: ReactNode;
}

function Modal({ modalTitle, isOpen, close, children }: ModalInterface) {
  return (
    <div className={isOpen ? "modal-is-opening" : ""}>
      <dialog open={isOpen}>
        <article>
          <a
            href="#close"
            aria-label="Close"
            className="close"
            onClick={close}
          ></a>
          <h1>{modalTitle}</h1>

          {children}
        </article>
      </dialog>
    </div>
  );
}

export default Modal;
