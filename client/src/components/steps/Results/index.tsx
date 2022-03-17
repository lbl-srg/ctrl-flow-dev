import { Fragment, useState } from "react";
import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";

import "../../../styles/steps/results.scss";
import ImgControl from "./ImgControl";

function Results() {
  const [activeTab, setActiveTab] = useState("schematics");

  const { activeTemplate } = useStore((state) => {
    return { activeTemplate: state.getActiveTemplate() };
  });

  function getClass(tab: string): string {
    return tab === activeTab ? "active" : "";
  }

  return (
    <Fragment>
      <PageHeader headerText="Results" />
      <h2>{activeTemplate?.name}</h2>
      <div className="results-page">
        <nav className="tab-list">
          <ul>
            <li
              className={getClass("sequence")}
              onClick={() => setActiveTab("sequence")}
            >
              Sequence
            </li>
            <li
              className={getClass("pointList")}
              onClick={() => setActiveTab("pointList")}
            >
              Point List
            </li>
            <li
              className={getClass("schematics")}
              onClick={() => setActiveTab("schematics")}
            >
              Schematics
            </li>
            <li
              className={getClass("schedules")}
              onClick={() => setActiveTab("schedules")}
            >
              Schedules
            </li>
          </ul>
        </nav>

        <ImgControl />
      </div>
    </Fragment>
  );
}

export default Results;
