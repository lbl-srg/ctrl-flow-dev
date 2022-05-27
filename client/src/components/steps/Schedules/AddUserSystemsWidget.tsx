import { AddUserSystemsWidgetProps, AddUserSystemFormData } from "./Types";
import { ChangeEvent, FormEvent } from "react";
import { getFormData } from "../../../utils/dom-utils";
import itl from "../../../translations";
import { useStores } from "../../../data";

function AddUserSystemsWidget({ configs }: AddUserSystemsWidgetProps) {
  // const { addUserSystems, activeConfig, setActiveConfigId } = useStore(
  //   (state) => {
  //     return { ...state, activeConfig: state.getActiveConfig() };
  //   },
  // );

  const { configStore } = useStores();
  const config = configStore.activeConfig;

  const initValues = {
    tag: "",
    start: 1,
    quantity: 1,
    configId: config?.id || undefined,
  };

  function configChange(ev: ChangeEvent<HTMLSelectElement>) {
    // setActiveConfigId(Number(ev.target.value));
  }

  function onWidgetSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const formValues = getFormData(ev.currentTarget) as AddUserSystemFormData;

    // addUserSystems(
    //   formValues.tag,
    //   Number(formValues.start),
    //   Number(formValues.quantity),
    //   config,
    // );
  }

  return (
    <div className="add-user-systems-widget">
      <form onSubmit={onWidgetSubmit}>
        <div className="row input-container">
          <label className="col-xs-4">
            {itl.terms.equipmentTag}
            <input
              type="text"
              name="tag"
              defaultValue={initValues.tag}
              placeholder=""
            />
          </label>

          <label className="col-xs-2">
            {itl.terms.id} #
            <input
              name="start"
              type="number"
              defaultValue={initValues.start}
              placeholder="1"
            />
          </label>

          <label className="col-xs-4">
            {itl.terms.configuration}
            <select
              name="config"
              defaultValue={initValues.configId}
              disabled={configs.length === 0}
              onChange={configChange}
            >
              {configs.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="col-xs-2">
            {itl.terms.quantity}
            <input
              name="quantity"
              type="number"
              defaultValue={initValues.quantity}
              placeholder="1"
            />
          </label>
        </div>

        <div className="submit-container">
          <button type="submit" className="small inline">
            {itl.terms.add}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddUserSystemsWidget;
