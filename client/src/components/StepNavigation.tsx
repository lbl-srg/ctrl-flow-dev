import { Link, useLocation } from "react-router-dom";
import DownloadModal from "./modal/DownloadModal";
import { useState, Fragment } from "react";
import itl from "../translations";

import "../styles/components/step-navigation.scss";

const steps = [
  { label: "Landing", path: "/" },
  { label: "Systems", path: "/systems" },
  { label: "Configs", path: "/configs" },
  // { label: "Schedules", path: "/schedules" },
  { label: "Results", path: "/results" },
];

function StepNavigation() {
  const [downloadOpen, setDownloadOpen] = useState(false);

  const location = useLocation();
  const currentIndex = steps.findIndex(
    ({ path }) => location.pathname === path,
  );

  const currentLabel = steps[currentIndex].label;
  const previous = steps[currentIndex - 1];
  const next = steps[currentIndex + 1];

  return (
    <Fragment>
      <DownloadModal
        isOpen={downloadOpen}
        close={() => setDownloadOpen(false)}
      />
      <div className="step-navigation">
        {previous && (
          <div className="prev-container">
            <Link to={previous.path}>
              <i className="icon-left-open" />
              {itl.terms.back}
            </Link>
          </div>
        )}

        <div className="step-links">
          {steps
            .filter(({ path }) => path !== "/")
            .map(({ label, path }) => {
              return (
                <Link
                  key={label}
                  to={path}
                  className={location.pathname === path ? "active" : ""}
                >
                  <div className="marker"></div>
                  {label}
                </Link>
              );
            })}
        </div>

        <div className="next-container">
          {next && (
            <Link role="button" to={next.path}>
              {itl.phrases.nextStep}: {next.label}
              <i className="icon-right-open right" />
            </Link>
          )}

          {currentLabel === "Results" && (
            <button onClick={() => setDownloadOpen(true)}>
              {itl.phrases.allDownloads}
            </button>
          )}
        </div>
      </div>
    </Fragment>
  );
}

export default StepNavigation;
