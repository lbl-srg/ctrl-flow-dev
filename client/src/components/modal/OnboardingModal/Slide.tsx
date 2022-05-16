import { Fragment } from "react";
import itl from "../../../translations";
import { SlideProps } from "./types";

const slides = [
  {},
  { img: "/onboarding/edit-project.png" },
  { img: "/onboarding/add-systems.png" },
  { img: "/onboarding/edit-config.png" },
  { img: "/onboarding/schedules.png" },
  { img: "/onboarding/schedules.png" },
  { img: "/onboarding/results.png" },
];

function SlideOne({ slideNum }: SlideProps) {
  const slide = { ...itl.onboarding[slideNum], ...slides[slideNum] };

  return (
    <Fragment>
      <h1>{slide.title}</h1>
      <p className="columns">{slide.copy}</p>
      <ul>
        {slide.points.map((point, index) => {
          return <li key={index}>{point}</li>;
        })}
      </ul>

      <div className="img-container">
        {slide.img ? <img src={slide.img} /> : null}
      </div>
    </Fragment>
  );
}

export default SlideOne;
