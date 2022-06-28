import { FormEvent, Fragment, useEffect, useState } from "react";

import Modal from "../../modal/Modal";
import "../../../styles/components/config-slide-out.scss";
import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import Option from "./options/Option";
import { getFormData } from "../../../utils/dom-utils";
import { poj } from "../../../utils/utils";

const SlideOut = ({ configId }: { configId: string }) => {
  const { configStore, uiStore, templateStore } = useStores();

  const config = configStore.getById(configId);
  const template = templateStore.getTemplateByPath(config.templatePath);
  const options = templateStore.getOptionsForTemplate(template?.modelicaPath);

  const [isOpen, setOpen] = useState(false);

  function openPanel() {
    setOpen(true);
    uiStore.setOpenSystemPath(config.systemPath);
  }

  function save(ev: FormEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    const data = getFormData(ev.target as HTMLFormElement);

    configStore.setSelections(
      config.id,
      Object.entries(data).map(([name, value]) => ({ name, value })),
    );

    setOpen(false);
  }

  return (
    <Fragment>
      <button disabled={config.isLocked} className="small" onClick={openPanel}>
        {itl.terms.edit}
      </button>

      <Modal
        close={() => setOpen(false)}
        isOpen={isOpen}
        className="config-slide-out"
      >
        <h3>{template?.name}</h3>

        <form onSubmit={save}>
          <input
            type="text"
            id="configName"
            name="configName"
            defaultValue={config.name}
            placeholder="Name Your Configuration"
          />

          {options.map((option: OptionInterface) => (
            <Option option={option} config={config} key={option.modelicaPath} />
          ))}

          <button type="submit">{itl.terms.save}</button>
        </form>
      </Modal>
    </Fragment>
  );
};

// const constructOption = ({ option, options }) => {
//   switch (option.type) {
//     case "dropdown": {
//       // TODO: figure out why 'option.options' is an array of
//       // numbers and not an array of options
//       const optionList =
//         option.options?.map((childO) =>
//           options.find((o) => o.id === childO.id),
//         ) || [];
//       return (
//         <SelectInput
//           id={option.name}
//           name={option.name}
//           label={option.name}
//           options={optionList}
//         />
//       );
//     }
//     default:
//       // TODO: implement other input types
//       return null;
//   }
// };

// const OptionDisplay = ({ option }: { option: OptionInterface }) => {
//   // const childOption = options.find((o) => o.id === formik.values[option.name]);

//   return (
//     <Fragment>
//       {constructOption({ option, options })}
//       {childOption && (
//         <OptionDisplay option={childOption} options={options} formik={formik} />
//       )}
//     </Fragment>
//   );
// };

export default SlideOut;
