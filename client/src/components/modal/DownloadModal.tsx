import Modal, { ModalInterface } from "./Modal";
import { useState, ChangeEvent } from "react";
import itl from "../../translations";
import { useStores } from "../../data";
import { ConfigInterface } from "../../data/config";
import { ProjectDetailInterface } from "../../data/project";

const CONTROL_SEQUENCE = "Control Sequence";
const DOCX = "docx";

const DOWNLOADABLE_FILE_LIST = [
  { label: "Full Project", ext: "zip" },
  { label: "Schematics", ext: "rvt" },
  { label: CONTROL_SEQUENCE, ext: DOCX },
  { label: "Points List", ext: "pdf" },
  { label: "Equipment Schedules", ext: "csv" },
  { label: "CDL", ext: "json" },
];

function DownloadModal({ isOpen, close }: ModalInterface) {
  const { projectStore, configStore } = useStores();
  const [checked, setChecked] = useState(
    DOWNLOADABLE_FILE_LIST.map(({ label }) => label),
  );

  const projectDetails: ProjectDetailInterface | undefined = projectStore.getProjectDetails();
  const projectConfigs: ConfigInterface[] = configStore.getConfigsForProject();

  function updateItem(event: ChangeEvent<HTMLInputElement>, label: string) {
    if (event.target.checked) {
      setChecked(checked.concat(label));
      return;
    }

    setChecked(checked.filter((item) => item !== label));
  }

  function getSequenceData() {
    let seqData: {[key: string]: any} = {};
    const projectSelections = {
      selections: {...projectDetails?.selections},
      evaluatedValues: {...projectDetails?.evaluatedValues},
    };

    const projectItem: any = [...projectConfigs, projectSelections];

    projectItem.forEach((item: any) => {
      const itemData = { ...item.evaluatedValues, ...item.selections };
      const itemKeys = Object.keys(itemData);

      itemKeys.forEach((key) => {
        if (seqData[key] !== undefined) {
          const initalValue = seqData[key];
          if (seqData[key].indexOf(itemData[key]) === -1) {
            seqData[key].push(itemData[key]);
          }
        } else {
          const [modelicaPath, instancePath] = key.split("-");
          if (modelicaPath !== itemData[key]) {
            seqData[key] = [itemData[key]];
          }
        }
      });
    });

    seqData = {
      ...seqData,
      UNITS: [projectDetails?.units],
      DEL_INFO_BOX: [true],
    }

    console.log('seqData: ', seqData);

    return seqData;
  }

  async function downloadFiles() {
    if (checked.includes(CONTROL_SEQUENCE)) {
      const response = await fetch(`${process.env.REACT_APP_API}/sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getSequenceData()),
      });

      // TODO: Handle error responses which do not contain an actual file
      const sequenceDocument = await response.blob();
      const placeholderLink = document.createElement("a");
      placeholderLink.href = window.URL.createObjectURL(sequenceDocument);
      placeholderLink.download = `${CONTROL_SEQUENCE}.${DOCX}`;
      placeholderLink.click();
    }

    close();
  }

  return (
    <Modal close={close} isOpen={isOpen}>
      <h1>{itl.phrases.selectToDownload}</h1>

      <ul className="check-list">
        {DOWNLOADABLE_FILE_LIST.map(({ label, ext }) => (
          <li key={label} className="template">
            <label>
              <input
                type="checkbox"
                onChange={(ev) => updateItem(ev, label)}
                checked={checked.includes(label)}
              />
              {label}
              <span className="info uppercase">.{ext}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="action-bar margin-top-lg">
        <button className="inline" onClick={downloadFiles}>
          {itl.phrases.downloadSelected}
        </button>
      </div>
    </Modal>
  );
}

export default DownloadModal;
