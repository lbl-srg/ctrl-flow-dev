import { Fragment, useState } from "react";
import PageHeader from "../../PageHeader";
import itl from "../../../translations";

import "../../../styles/steps/results.scss";
import ImgControl from "./ImgControl";
import { useStores } from "../../../data";

function Results() {
  const [activeTab, setActiveTab] = useState("schematics");
  const { uiStore } = useStores();

  const activeTemplate = uiStore.activeTemplate;

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
              {itl.terms.sequence}
            </li>
            <li
              className={getClass("pointList")}
              onClick={() => setActiveTab("pointList")}
            >
              {itl.terms.pointList}
            </li>
            <li
              className={getClass("schematics")}
              onClick={() => setActiveTab("schematics")}
            >
              {itl.terms.schematics}
            </li>
            <li
              className={getClass("schedules")}
              onClick={() => setActiveTab("schedules")}
            >
              {itl.terms.schedules}
            </li>
          </ul>
        </nav>

        <ImgControl />
      </div>
    </Fragment>
  );
}

export default Results;
