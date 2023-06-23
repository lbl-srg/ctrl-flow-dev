import Modal, { ModalInterface } from "./Modal";

function AboutModal({ isOpen, close }: ModalInterface) {
  const links: string[] = ['https://simulationresearch.lbl.gov/modelica', 'https://obc.lbl.gov', 'https://www.ashrae.org/permissions'];
  const email = <a href = "mailto:ctrl-flow@lbl.gov">ctrl-flow@lbl.gov</a>;
  const copyRightLink = <a href="https://github.com/lbl-srg/ctrl-flow-dev/blob/main/LEGAL.txt">copyright</a>;
  const licenseLink = <a href="https://github.com/lbl-srg/ctrl-flow-dev/blob/main/LICENSE.txt">open source terms</a>;
  
  function renderLink(link: string) {
    return (
      <a href={link}
        target="_blank"
        rel="noopener noreferrer">
          {link}
      </a>
    );
  }

  return (
    <Modal close={close} isOpen={isOpen}>
      <h1>About Us</h1>

      <div className="info-container">
        <p>This work was supported by the Assistant Secretary for Energy Efficiency and Renewable Energy, Office of Building Technologies of the U.S. Department of Energy, under Contract No. DE-AC02-05CH11231.</p>
        <p>The tool incorporates work from the Lawrence Berkeley National Laboratory’s Modelica Buildings Library and the OpenBuildingControls project. Details on these can be found at {renderLink(links[0])} and {renderLink(links[1])}.</p>
        <p>The software developed for this tool is protected by {copyRightLink} and is available for use under {licenseLink}. For details please contact us by email: {email}</p>
        <p>Many of the control sequences in this tool are from ASHRAE ® Guideline 36. These sequences are used per the terms stated at: {renderLink(links[2])}. ASHRAE is not endorsing or supporting the use of this tool.</p>
      </div>
      
      <div className="action-bar margin-top-lg">
        <button className="inline" onClick={close}>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default AboutModal;