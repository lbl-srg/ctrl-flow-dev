import { useNavigate } from "react-router-dom";
import EditDetailsModal from "../modal/EditDetailsModal";
import { useState, Fragment } from "react";

import "../../styles/steps/landing.scss";

// step 0
function Landing() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Fragment>
      <EditDetailsModal
        close={() => setModalOpen(false)}
        isOpen={modalOpen}
        modalTitle="Create New Project"
        submitText="Create Project"
        afterSubmit={() => navigate("/details")}
      ></EditDetailsModal>

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

            {/* <div className="col-md-5 col-xs-12">
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
            </div> */}
          </div>
        </article>

        <div className="row">
          <div className="col-md-6 col-xs-12">
            <button onClick={() => setModalOpen(true)} className="outline">
              <i className="icon-plus-squared-alt large" />
              Create New Project
            </button>
          </div>

          <div className="col-md-6 col-xs-12">
            <button
              className="outline"
              onClick={() => alert("an upload dialogue should appear.")}
            >
              <i className="icon-upload large" />
              Upload Existing Project
            </button>
          </div>
        </div>
      </main>
    </Fragment>
  );
}

export default Landing;
