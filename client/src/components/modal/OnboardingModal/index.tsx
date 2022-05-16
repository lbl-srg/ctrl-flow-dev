import Modal from "../Modal";
import { useState, useEffect, MouseEvent } from "react";
import Slide from "./Slide";
import itl from "../../../translations";

import "../../../styles/components/onboarding-modal.scss";

function OnboardingModal() {
  const slides = itl.onboarding;
  const [slide, setSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [offset, setOffset] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);

  const calculate = () => {
    const $el = document.querySelector(".modal-content");

    if (!$el) return;

    setSlideWidth($el.getBoundingClientRect().width || 0);
    setOffset(slide * slideWidth);
  };

  useEffect(calculate, [slide]);

  useEffect(() => {
    window.addEventListener("resize", calculate);
    document.body.addEventListener("keyup", navigate);
    return () => {
      document.body.removeEventListener("keyup", navigate);
      window.removeEventListener("resize", calculate);
    };
  });

  function prev(ev?: MouseEvent) {
    if (slide === 0) return;
    if (ev) ev.preventDefault();
    setSlide(slide - 1);
  }

  function next() {
    if (slide === slides.length - 1) setIsOpen(false);
    else setSlide(slide + 1);
  }

  function navigate(ev: KeyboardEvent) {
    if (ev.key === "ArrowRight") next();
    else if (ev.key === "ArrowLeft") prev();
  }

  const close = () => setIsOpen(false);

  return (
    <Modal close={close} isOpen={isOpen} className="onboarding-modal">
      <div className="modal-content">
        <div className="slide-container" style={{ marginLeft: -offset }}>
          {slides.map((comp, index) => {
            return (
              <Slide
                key={index}
                slideWidth={slideWidth}
                slideNum={index}
                isActive={index === slide}
              />
            );
          })}
        </div>
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
