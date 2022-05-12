import Modal from "../Modal";
import { SyntheticEvent, useState } from "react";
import Slide from "./Slide";
import itl from "../../../translations";

import "../../../styles/components/onboarding-modal.scss";

function OnboardingModal() {
  const slides = itl.onboarding;
  const [slide, setSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  function prev(ev: SyntheticEvent) {
    ev.preventDefault();
    setSlide(slide - 1);
  }

  function next() {
    if (slide === slides.length - 1) setIsOpen(false);
    else setSlide(slide + 1);
  }

  const close = () => setIsOpen(false);

  return (
    <Modal close={close} isOpen={isOpen} className="onboarding-modal">
      <div className="slide-container">
        <Slide slideNum={slide} />
      </div>

      <div className="controls">
        <a
          href="#"
          onClick={prev}
          className={slide === 0 ? "prev disabled" : "prev"}
        >
          <i className="icon-left-open" />
          {itl.buttons.back}
        </a>

        <div className="marker-container">
          {slides.map((comp, index) => {
            const classes = ["marker"];
            if (slide === index) classes.push("active");
            return (
              <div
                key={index}
                onClick={() => setSlide(index)}
                className={classes.join(" ")}
              />
            );
          })}
        </div>

        <button className="small next" onClick={next}>
          {itl.buttons.continue}
        </button>
      </div>
    </Modal>
  );
}

export default OnboardingModal;
