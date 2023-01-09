import Modal, { ModalInterface } from "./Modal";
import { useState, ChangeEvent } from "react";
import itl from "../../translations";
import { useStores } from "../../data";
import { ConfigInterface } from "../../data/config";
import { ProjectDetailInterface } from "../../data/project";

import Spinner from '../Spinner';

const CONTROL_SEQUENCE = "Control Sequence";
const CONTROL_SEQUENCE_WITH_INFO_TEXT = "Control Sequence with Informative Text"
const DOCX = "docx";

const DOWNLOADABLE_FILE_LIST = [
  // { label: "Full Project", ext: "zip" },
  // { label: "Schematics", ext: "rvt" },
  { label: CONTROL_SEQUENCE, ext: DOCX },
  { label: CONTROL_SEQUENCE_WITH_INFO_TEXT, ext: DOCX },
  // { label: "Points List", ext: "pdf" },
  // { label: "Equipment Schedules", ext: "csv" },
  // { label: "CDL", ext: "json" },
];

function DownloadModal({ isOpen, close }: ModalInterface) {
  const { projectStore, configStore } = useStores();
  // const [checked, setChecked] = useState(
  //   DOWNLOADABLE_FILE_LIST.map(({ label }) => label),
  // );

  const [checked, setChecked] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);

  const projectConfigs: ConfigInterface[] = configStore.getConfigsForProject();

  function updateItem(event: ChangeEvent<HTMLInputElement>, label: string) {
    // if (event.target.checked) {
    //   setChecked(checked.concat(label));
    //   return;
    // }

    // setChecked(checked.filter((item) => item !== label));
    if (event.target.checked) {
      setChecked([label]);
      return;
    }

    setChecked([]);
  }

  function getSequenceData() {
    const seqData: {[key: string]: any} = {};

    projectConfigs.forEach((config) => {
      const configData = { ...config.evaluatedValues, ...config.selections };
      const configKeys = Object.keys(configData);

      configKeys.forEach((key) => {
        if (seqData[key] !== undefined) {
          const initalValue = seqData[key];
          if (seqData[key].indexOf(configData[key]) === -1) {
            seqData[key].push(configData[key]);
          }
        } else {
          const [modelicaPath, instancePath] = key.split("-");
          if (modelicaPath !== configData[key]) {
            seqData[key] = [configData[key]];
          }
        }
      });
    });

    return seqData;
  }

  async function downloadFiles() {
    setLoading(true);
    if (checked.includes(CONTROL_SEQUENCE)) {
      const response = await fetch(`${process.env.REACT_APP_API}/sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...getSequenceData(), DEL_INFO_BOX: [true]}),
      });

      // TODO: Handle error responses which do not contain an actual file
      const sequenceDocument = await response.blob();
      const placeholderLink = document.createElement("a");
      placeholderLink.href = window.URL.createObjectURL(sequenceDocument);
      placeholderLink.download = `${CONTROL_SEQUENCE}.${DOCX}`;
      placeholderLink.click();
    }

    if (checked.includes(CONTROL_SEQUENCE_WITH_INFO_TEXT)) {
      const response = await fetch(`${process.env.REACT_APP_API}/sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...getSequenceData(), DEL_INFO_BOX: [false]}),
      });

      // TODO: Handle error responses which do not contain an actual file
      const sequenceDocument = await response.blob();
      const placeholderLink = document.createElement("a");
      placeholderLink.href = window.URL.createObjectURL(sequenceDocument);
      placeholderLink.download = `${CONTROL_SEQUENCE}.${DOCX}`;
      placeholderLink.click();
    }

    setLoading(false);
    close();
  }

  return (
    <Modal close={close} isOpen={isOpen}>
      <h1>{itl.phrases.selectToDownload}</h1>

      <Spinner
        loading={isLoading}
        text="Creating Sequence Document. Please wait... this may take up to one minute."
      />

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
