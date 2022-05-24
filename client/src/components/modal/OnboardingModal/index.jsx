import Modal from "../Modal";
import { useState, useEffect } from "react";
import Slide from "./Slide";

import itl from "../../../translations";
import "../../../styles/components/onboarding-modal.scss";

function OnboardingModal() {
  const slides = itl.onboarding;
  const [slide, setSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    document.body.addEventListener("keyup", navigate);
    return () => document.body.removeEventListener("keyup", navigate);
  });

  function prev(ev) {
    if (slide === 0) return;
    if (ev) ev.preventDefault();
    setSlide(slide - 1);
  }

  function next() {
    if (slide === slides.length - 1) setIsOpen(false);
    else setSlide(slide + 1);
  }

  function navigate(ev) {
    if (ev.key === "ArrowRight") next();
    else if (ev.key === "ArrowLeft") prev();
  }

  const close = () => setIsOpen(false);

  return (
    <Modal close={close} isOpen={isOpen} className="onboarding-modal">
      <Slide slideNum={slide} />

      <div className="controls">
        <a
          href="#"
          onClick={prev}
          className={slide === 0 ? "prev disabled" : "prev"}
        >
          <i className="icon-left-open" />
          {itl.terms.back}
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
          {itl.terms.continue}
        </button>
      </div>
    </Modal>
  );
}

export default OnboardingModal;
