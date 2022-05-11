import Modal from "../Modal";
import { SyntheticEvent, useState } from "react";
import SlideOne from "./SlideOne";
import SlideTwo from "./SlideTwo";

import "../../../styles/components/onboarding-modal.scss";

function OnboardingModal() {
  const [slide, setSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const slides = [SlideOne, SlideTwo];
  const CurrentSlide = slides[slide];

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
        <CurrentSlide />
      </div>

      <div className="controls">
        <a
          href="#"
          onClick={prev}
          className={slide === 0 ? "prev disabled" : "prev"}
        >
          <i className="icon-left-open" />
          back
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
          continue
        </button>
      </div>
    </Modal>
  );
}

export default OnboardingModal;
