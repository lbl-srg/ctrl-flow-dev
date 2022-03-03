import { Fragment } from "react";
import styled from "@emotion/styled";

import { useStore, SystemTemplate, SystemType } from "../../store/store";

import Sidebarlayout from "../layouts/SidebarLayout";
import LeftNav from "../LeftNavigation";
// step 2
const Systems = () => (
  <Sidebarlayout
    heading="Add Systems"
    contentLeft={<LeftNav />}
    contentRight={<ContentRight />}
  />
);

const ContentRight = () => {
  const { getTemplates, systemTypes } = useStore((state) => ({
    getTemplates: state.getTemplates,
    systemTypes: state.systemTypes,
  }));

  const templates = getTemplates();

  return (
    <Fragment>
      <div>Select the systems types you will configure:</div>
      <TemplateGroupList
        systemTypes={systemTypes}
        templates={templates}
      />
    </Fragment>
  );
};

interface TemplateGroupListProps {
  systemTypes: SystemType[];
  templates: SystemTemplate[];
}

const TemplateGroupList = ({
  systemTypes,
  templates,
}: TemplateGroupListProps) => {
  const getActiveTemplates = useStore((state) => state.getActiveTemplates);
  const addConfig = useStore((state) => state.addConfig);
  const removeAllTemplateConfigs = useStore((state) => state.removeAllTemplateConfigs);

  const activeTemplates = getActiveTemplates();

  const handler = (selection: string, value: boolean) => {
    const system = templates.find((s) => s.name === selection);
    if (system) {
      value ? addConfig(system, {name: 'Default'}) : removeAllTemplateConfigs(system);
    }
  };

  return (
    <Fragment>
      {systemTypes.map((systemType) => (
        <MultiSelect
          key={systemType.id}
          title={systemType.name}
          options={templates
            .filter((t) => t.systemType.id === systemType.id)
            .map((s) => {
              const value =
                activeTemplates.findIndex((userS) => userS.id === s.id) >= 0;
              return { text: s.name, value: value };
            })}
          handler={handler}
        />
      ))}
    </Fragment>
  );
};

interface MultiSelectProps {
  title: string;
  options: { text: string; value: boolean }[];
  handler: (s: string, value: boolean) => void;
}

const MultiSelect = ({ title, options, handler }: MultiSelectProps) => {
  const helpText = ""; // TODO: extract from template

  return (
    <Fragment key={title}>
      <div>
        <a id={title}>
          <h3>{title}</h3>
        </a>
        {options.map((option) => (
          <OptionSelect
            text={option.text}
            value={option.value}
            helpText={helpText}
            handler={handler}
            id={`${title}-${option.text}`}
            key={`${title}-${option.text}`}
          />
        ))}
      </div>
    </Fragment>
  );
};

interface OptionSelectProps {
  text: string;
  value: boolean;
  helpText: string;
  handler: (text: string, value: boolean) => void;
  id: string;
}

const OptionSelect = ({
  text,
  value,
  helpText,
  handler,
  id,
}: OptionSelectProps) => {
  return (
    <a id={id}>
      <OptionSelectContainer>
        <Checkbox
          id={id}
          name="selected"
          type="checkbox"
          checked={value}
          onChange={(e) => handler(text, e.target.checked)}
        ></Checkbox>
        <OptionLabel htmlFor={id}>{text}</OptionLabel>
        <OptionInfo infoText="" />
      </OptionSelectContainer>
    </a>
  );
};

interface OptionInfoProps {
  infoText: string;
}

const OptionInfo = ({ infoText }: OptionInfoProps) => {
  return <InfoIcon>[i]</InfoIcon>;
};

const OptionLabel = styled.label`
  display: inline-block;
  font-weight: bold;
  flex: 1;
`;

const Checkbox = styled.input`
  display: inline-block;
`;
const OptionSelectContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const InfoIcon = styled.div``;

export default Systems;
