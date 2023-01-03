import Modal, { ModalInterface } from "./Modal";

function SupportModal({ isOpen, close }: ModalInterface) {
  const link = <a
    href="https://github.com/lbl-srg/ctrl-flow/discussions"
    target="_blank"
    rel="noopener noreferrer">
      https://github.com/lbl-srg/ctrl-flow/discussions
  </a>;
  const email = <a href = "mailto:ctrl-flow@lbl.gov">ctrl-flow@lbl.gov</a>;

  return (
    <Modal close={close} isOpen={isOpen}>
      <h1>Contact Support</h1>

      <div className="info-container">
        <p>Please go to {link} to browse discussions for issues and recommended solutions for users of the ctrl-flow High Performance Controls Design tool.</p>
        <p>You can post a new question, issue or response to discussions by creating a GitHub ID.</p>
        <p>Or contact us by email: {email}</p>
      </div>
      
      <div className="action-bar margin-top-lg">
        <button className="inline" onClick={close}>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default SupportModal;