import Modal, { ModalInterface } from "./Modal";
import { useStores } from "../../data";
import { ConfigInterface } from "../../data/config";

function ValidationModal({ isOpen, close }: ModalInterface) {
  const { configStore, templateStore } = useStores();

  const configs: ConfigInterface[] = configStore.getConfigsForProject();
  const allTemplates = templateStore.getAllTemplates();

  const configStatus = getConfigStatus();

  function getConfigStatus() {
    const configStatus = configs.map((config) => {
      const evaluatedValues = { ...config.evaluatedValues };
      const hasEvaluatedValues = Object.keys(evaluatedValues).length > 0;

      return {
        templateName: allTemplates[config.templatePath]?.name,
        configName: config.name,
        isSaved: hasEvaluatedValues,
      };
    });

    return configStatus;
  }

  return (
    <Modal close={close} isOpen={isOpen}>
      <h1>Please edit and save all configs</h1>
      {configStatus.length > 0 && (
        <div>Below is a list of your unsaved configs.</div>
      )}
      {configStatus.length > 0 ? (
        <ul className="check-list">
          {configStatus.map(({ templateName, configName, isSaved }) => (
            !isSaved ? (
              <li key={`${templateName}-${configName}`} className="template">
                <label className="no-pointer">
                  <div>Config: {configName}</div>
                  <span className="info">{templateName}</span>
                </label>
              </li>
            ) : null
          ))}
        </ul>
      ) : (
        <div>You currently have no configs selected. Please go back, select and save at least one config.</div>
      )}
      <div className="action-bar margin-top-lg">
        <button className="inline" onClick={close}>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default ValidationModal;
