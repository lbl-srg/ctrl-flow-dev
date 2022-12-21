import { Link, useLocation } from "react-router-dom";
import DownloadModal from "./modal/DownloadModal";
import ValidationModal from "./modal/ValidationModal";
import { useState, Fragment, SyntheticEvent } from "react";
import itl from "../translations";
import { useStores } from "../data";
import { ConfigInterface } from "../data/config";

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
  const [validationOpen, setValidationOpen] = useState(false);

  const location = useLocation();
  const currentIndex = steps.findIndex(
    ({ path }) => location.pathname === path,
  );

  const currentLabel = steps[currentIndex].label;
  const previous = steps[currentIndex - 1];
  const next = steps[currentIndex + 1];

  const { configStore, templateStore } = useStores();
  const allTemplates = templateStore.getAllTemplates();

  function checkIfActive() {
    const configs: ConfigInterface[] = configStore.getConfigsForProject();
    let isActive = true;

    configs.every((config) => {
      const evaluatedValues = { ...config.evaluatedValues };
      const hasEvaluatedValues = Object.keys(evaluatedValues).length > 0;

      if (!hasEvaluatedValues) {
        isActive = false;
        return false;
      }
      return true;
    });

    return isActive;
  }

  function onNextStep(e: SyntheticEvent, path: string) {
    if (path === "/results") {
      const isActive = checkIfActive();
      if (isActive) {
        setDownloadOpen(true);
      } else {
        e.preventDefault();
        setValidationOpen(true);
      }
    }
  }

  return (
    <Fragment>
      <DownloadModal
        isOpen={downloadOpen}
        close={() => setDownloadOpen(false)}
      />
      <ValidationModal
        isOpen={validationOpen}
        close={() => setValidationOpen(false)}
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
                  onClick={(e) => onNextStep(e, path)}
                >
                  <div className="marker"></div>
                  {label}
                </Link>
              );
            })}
        </div>

        <div className="next-container">
          {next && (
            <Link role="button" to={next.path} onClick={(e) => onNextStep(e, next.path)}>
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
