import { Fragment, useState } from "react";
import { useStore, Configuration, System, State } from "../../store/store";
import Modal from "./Modal";

import "../../styles/components/config-slide-out.scss";

interface SlideOutProps {
  template: System;
  config?: Configuration;
}

const SlideOut = ({ template, config }: SlideOutProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { options } = useStore((state) => ({
    options: state.templates.options,
  }));
  const systemOptions = template.options
    ? template.options.map((optionId) => options.find((o) => o.id === optionId))
    : [];

  return (
    <Fragment>
      <button onClick={() => setIsOpen(true)}>Edit</button>
      <Modal
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        className="config-slide-out"
      >
        <h2>{template.name}</h2>
      </Modal>
    </Fragment>
  );
};

export default SlideOut;
