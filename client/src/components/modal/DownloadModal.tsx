import Modal, { ModalInterface } from "./Modal";
import { useState, ChangeEvent } from "react";
import itl from "../../translations";

function DownloadModal({ isOpen, close }: ModalInterface) {
  const files = [
    { label: "Full Project", ext: "zip" },
    { label: "Schematics", ext: "rvt" },
    { label: "Control Sequence", ext: "doc" },
    { label: "Points List", ext: "pdf" },
    { label: "Equipment Schedules", ext: "csv" },
    { label: "CDL", ext: "json" },
  ];

  const [checked, setChecked] = useState(files.map(({ label }) => label));

  function updateItem(ev: ChangeEvent<HTMLInputElement>, label: string) {
    if (ev.target.checked) setChecked(checked.concat(label));
    else setChecked(checked.filter((item) => item !== label));
  }

  return (
    <Modal close={close} isOpen={isOpen}>
      <h1>{itl.phrases.selectToDownload}</h1>

      <ul className="check-list">
        {files.map(({ label, ext }) => (
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
        <button className="inline" onClick={close}>
          {itl.phrases.downloadSelected}
        </button>
      </div>
    </Modal>
  );
}

export default DownloadModal;
