import { useNavigate } from "react-router-dom";
import EditDetailsModal from "../modal/EditDetailsModal";
import "../../css/steps/landing.css";

// step 0
function Landing() {
  const navigate = useNavigate();

  return (
    <div className="container-fluid">
      <main className="landing">
        <header>
          <h1>Welcome to Lawrence Berkley National Labs</h1>
          <h2>HVAC Controls Design Tool</h2>
        </header>

        <article>
          <div className="row">
            <div className="col-md-7 col-xs-12">
              <h3>HVAC Controls Design Tool</h3>
              <p>
                The controls design tool allows you to model the complete HVAC
                system for your buildings project. Simply select the system
                components, configure those systems, create relationshops, and
                then export the final model into the open source Modelica
                language for siumulation and control.
              </p>
            </div>

            <div className="col-md-5 col-xs-12">
              <ul className="components">
                <li>
                  <i className="icon-th-list" />
                  Select components
                </li>
                <li>
                  <i className="icon-cog" />
                  Configure systems
                </li>
                <li>
                  <i className="icon-table" />
                  Create system relationships
                </li>
              </ul>
            </div>
          </div>
        </article>

        <div className="row">
          <div className="col-md-6 col-xs-12">
            <EditDetailsModal
              modalTitle="Create New Project"
              submitText="Create Project"
              afterSubmit={() => navigate("/details")}
              className="outline"
            >
              <i className="icon-plus-squared-alt" />
              Create New Project
            </EditDetailsModal>
          </div>

          <div className="col-md-6 col-xs-12">
            <button
              className="outline"
              onClick={() => alert("an upload dialogue should appear.")}
            >
              <i className="icon-upload" />
              Upload Existing Project
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Landing;
