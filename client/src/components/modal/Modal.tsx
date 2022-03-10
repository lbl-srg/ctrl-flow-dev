import { ReactNode } from "react";
import "../../styles/components/modal.scss";

export interface ModalInterface {
  isOpen: boolean;
  close: () => void;
  className?: string;
  children?: ReactNode;
}

function Modal({ isOpen, close, className, children }: ModalInterface) {
  const classes = className ? [className] : [];
  if (isOpen) classes.push("modal-is-opening");

  return (
    <div className={classes.join(" ")}>
      <dialog open={isOpen}>
        <div className="underlay" onClick={close}></div>
        <article>
          <button
            aria-label="Close"
            className="close outline"
            onClick={close}
          ></button>

          {children}
        </article>
      </dialog>
    </div>
  );
}

export default Modal;
