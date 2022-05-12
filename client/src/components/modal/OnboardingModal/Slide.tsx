import { Fragment } from "react";
import itl from "../../../translations";
import { SlideProps } from "./types";

function SlideOne({ slideNum }: SlideProps) {
  const slide = itl.onboarding[slideNum];
  return (
    <Fragment>
      <h1>{slide.title}</h1>
      <p className="columns">{slide.copy}</p>
      <ul>
        {slide.points.map((point, index) => {
          return <li key={index}>{point}</li>;
        })}
      </ul>
    </Fragment>
  );
}

export default SlideOne;
