import { Link, useLocation } from "react-router-dom";
import "../styles/components/step-navigation.scss";

const steps = [
  { label: "Landing", path: "/" },
  { label: "Details", path: "/details" },
  { label: "Systems", path: "/systems" },
  { label: "Configs", path: "/configs" },
  { label: "Quantities", path: "/quantities" },
  { label: "Schedules", path: "/schedules" },
  { label: "Results", path: "/results" },
];

function StepNavigation() {
  const location = useLocation();
  const currentIndex = steps.findIndex(
    ({ path }) => location.pathname === path,
  );

  const previous = steps[currentIndex - 1];
  const next = steps[currentIndex + 1];

  return (
    <div className="step-navigation">
      <div className="row">
        <div className="col-xs-2">
          <Link to={previous.path}>
            <i className="icon-left-open" />
            Back
          </Link>
        </div>

        <div className="col-xs-8 step-links">
          {steps
            .filter(({ path }) => path !== "/")
            .map(({ label, path }) => {
              return (
                <Link key={label} to={path}>
                  {label}
                </Link>
              );
            })}
        </div>

        <div className="col-xs-2">
          {next && (
            <Link role="button" to={next.path}>
              Next Step: {next.label}
              <i className="icon-right-open right" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default StepNavigation;
