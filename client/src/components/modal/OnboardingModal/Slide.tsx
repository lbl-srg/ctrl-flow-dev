import { Fragment } from "react";
import itl from "../../../translations";
import { SlideProps } from "./types";

const slides = [
  {
    subHeader: (
      <div className="icon-list">
        <div>
          <i className="icon-th-list" />
          Systems
        </div>
        <div>
          <i className="icon-cog" />
          Configure
        </div>
        <div>
          <i className="icon-table" />
          Schedule
        </div>
        <div>
          <i className="icon-download" />
          Results
        </div>
      </div>
    ),
  },
  {
    icon: <i className="icon-pencil" />,
    img: <img src="/onboarding/edit-project.png" />,
  },
  {
    icon: <i className="icon-th-list" />,
    img: <img src="/onboarding/add-systems.png" />,
  },
  {
    icon: <i className="icon-cog" />,
    img: <img src="/onboarding/edit-config.png" />,
  },
  {
    icon: <i className="icon-table" />,
    img: <img src="/onboarding/schedules.png" />,
  },
  {
    icon: <i className="icon-table" />,
    img: <img src="/onboarding/schedules.png" />,
  },
  {
    icon: <i className="icon-download" />,
    img: <img src="/onboarding/results.png" />,
  },
];

function SlideOne({ slideNum, isActive, slideWidth }: SlideProps) {
  const slide = { ...itl.onboarding[slideNum], ...slides[slideNum] };

  return (
    <div
      className={isActive ? "slide active" : "slide"}
      style={{ minWidth: slideWidth }}
    >
      <h1>
        {slide.icon ? slide.icon : null}
        {slide.title}
      </h1>

      {slide.subHeader ? slide.subHeader : null}
      <p className="columns">{slide.copy}</p>

      <ul>
        {slide.points.map((point, index) => {
          return <li key={index}>{point}</li>;
        })}
      </ul>

      <div className="img-container">{slide.img ? slide.img : null}</div>
    </div>
  );
}

export default SlideOne;
