import { Fragment } from "react";

import { useStore, System, SystemType } from "../../store/store";

import Sidebarlayout from "../layouts/SidebarLayout";

// step 2
const Systems = () => (
  <Sidebarlayout
    heading="Add Systems"
    contentLeft={<p>hello</p>}
    contentRight={<ContentRight />}
  />
);

const ContentRight = () => {
  const templateSystems = useStore((state) => state.templates);
  if (templateSystems) {
    return (
      <Fragment>
        {SystemGroupList(templateSystems.systemType, templateSystems.system)}
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        <div></div>
      </Fragment>
    );
  }
};

const SystemGroupList = (typeList: SystemType[], systems: System[]) => {
  const systemByTypeList: { [key: string]: string[] } = {};
  return typeList.map((type) =>
    OptionList(
      type.name,
      systems.filter((s) => s.systemType === type.id).map((s) => s.name),
    ),
  );
};

const OptionList = (title: string, options: string[]) => {
  const optionList = options.map((option) => <li key="option">{option}</li>);
  return (
    <Fragment>
      <h3>{title}</h3>
      <ul>{optionList}</ul>
    </Fragment>
  );
};

export default Systems;
