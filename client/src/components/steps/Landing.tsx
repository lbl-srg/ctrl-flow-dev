import { useNavigate } from "react-router-dom";
import EditDetailsModal from "../modal/EditDetailsModal";
import OnboardingModal from "../modal/OnboardingModal";
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
        modalTitle="Project Configuration"
        submitText="Configure Project"
        afterSubmit={() => navigate("/systems")}
      ></EditDetailsModal>

      <OnboardingModal />

      <main className="landing">
        <header>
          <h1>Welcome to Lawrence Berkley National Labs</h1>
          <h2>HVAC Controls Design Tool</h2>
        </header>

        <article>
          <div className="row">
            <div className="col-md-7 col-xs-12">
              {/* TODO: this needs localized */}
              <h3>HVAC Controls Design Tool</h3>
              <p>
                The Controls Design Tool allows you to design high performance
                building control systems. By inputting your design selections
                and settings, the tool will provide you with the files you need
                for your project including:
              </p>

              <ul>
                <li>Detailed sequence</li>
                <li>Points lists</li>
                <li>Controls diagrams</li>
                <li>Additional files to assist with modeling and deployment</li>
              </ul>

              <p>
                This tool has been developed for the US Department of Energy and
                includes use of the sequence from ASHRAE Guideline 36.
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

        <div className='container'>
          <div className="row justify-content-center">
            <div className="col-xs-12">
              <button onClick={() => setModalOpen(true)} className="outline">
                <i className="icon-plus-squared-alt large" />
                Configure Project
              </button>
            </div>
          </div>
        </div>

        {/*<div className="row">
          <div className="col-md-6 col-xs-12">
            <button onClick={() => setModalOpen(true)} className="outline">
              <i className="icon-plus-squared-alt large" />
              Configure Project
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
        </div>*/}
      </main>
    </Fragment>
  );
}

export default Landing;
