import { Fragment } from "react";
import itl from "../../../translations";

export interface SlideOutOpenButtonProps {
  disabled: boolean;
  onClick: () => void;
}

const SlideOutOpenButton = ({ disabled, onClick }: SlideOutOpenButtonProps) => (
  <Fragment>
    <button disabled={disabled} className="small" onClick={onClick}>
      {itl.terms.edit}
    </button>
  </Fragment>
);

export default SlideOutOpenButton;
