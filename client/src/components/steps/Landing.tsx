import { useNavigate } from "react-router-dom";
import EditDetailsModal from "../modal/EditDetailsModal";
import OnboardingModal from "../modal/OnboardingModal";
import { useState, Fragment } from "react";

import PageHeader from "../PageHeader";

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

      <PageHeader headerText="" showLogo={true} />

      <main className="landing">
        <header>
          <h1 className="header-one">Welcome to Lawrence Berkley National Labs</h1>
          <h2 className="header-two">ctrl-flow</h2>
          <h3 className="header-three">High Performance Controls Design Tool</h3>
        </header>

        <article>
          <div className="row">
            <div className="col-md-7 col-xs-12">
              {/* TODO: this needs localized */}
              <h3 className="header-three">High Performance Controls Design Tool</h3>
              <p>
                Writing a detailed and accurate control sequence is hard to do!
                This tool makes it easy to design high performance control sequences following ASHRAE Guideline 36 and best practices.
                After inputting project details, the tool will produce a detailed sequence of operations document.
              </p>

              {/*<ul>
                <li>Detailed sequence</li>
                <li>Points lists</li>
                <li>Controls diagrams</li>
                <li>Additional files to assist with modeling and deployment</li>
              </ul>*/}

              <p>
                This tool has been developed for the US Department of Energy and
                includes use of the sequence from ASHRAE Guideline 36.
                ASHRAE is not endorsing or supporting the use of this tool.
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
