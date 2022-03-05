/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import styled from "@emotion/styled";
import { Fragment, useState } from "react";
import PageHeader from "../PageHeader";
import SlideOut from "../modal/ConfigSlideOut";

import { colors } from "../../styleHelpers";

import {
  useStore,
  Configuration,
  SystemTemplate,
  SystemType,
} from "../../store/store";

import { TextButton } from "../Button";

// step 3
const Configs = () => {
  const {
    getConfigs,
    systemTypes,
    getActiveTemplates,
    addConfig,
    removeConfig,
  } = useStore((state) => ({
    getConfigs: state.getConfigs,
    systemTypes: state.systemTypes,
    getActiveTemplates: state.getActiveTemplates,
    addConfig: state.addConfig,
    removeConfig: state.removeConfig,
  }));

  const configs = getConfigs();
  const templates = getActiveTemplates();

  // based on user configs, figure out which templates they are using

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />
      <div>Add Configurations For The System Types You Selected</div>
      {systemTypes.map((systemT) => {
        const systemTypeTemplates = templates.filter(
          (t) => t.systemType.id === systemT.id,
        );
        const confs = configs.filter((c) =>
          systemTypeTemplates.map((s) => s.id).includes(c.template.id),
        );

        return (
          <SystemConfigGroup
            key={systemT.id}
            systemType={systemT}
            templates={systemTypeTemplates}
            configs={confs}
            addConfig={addConfig}
            removeConfig={removeConfig}
          />
        );
      })}
    </Fragment>
  );
};

interface SystemConfigGroupProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  configs: Configuration[];
  addConfig: (template: SystemTemplate) => void;
  removeConfig: (config: Configuration) => void;
}

const SystemConfigGroup = ({
  systemType,
  templates,
  configs,
  addConfig,
  removeConfig,
}: SystemConfigGroupProps) => {
  return (
    <Fragment>
      <h3>{systemType.name}</h3>
      {templates.map((template) => (
        <SystemConfigs
          key={template.id}
          template={template}
          configs={configs.filter((c) => c.template.id === template.id)}
          addConfig={addConfig}
          removeConfig={removeConfig}
        />
      ))}
    </Fragment>
  );
};

interface SystemConfigsProps {
  template: SystemTemplate;
  configs: Configuration[];
  addConfig: (template: SystemTemplate) => void;
  removeConfig: (config: Configuration) => void;
}

const SystemConfigs = ({
  template,
  configs,
  addConfig,
  removeConfig,
}: SystemConfigsProps) => {
  return (
    <SystemConfigsContainer>
      <SystemTitleContainer>
        <SystemName>{template.name}</SystemName>
        <UploadDownload path=""></UploadDownload>
      </SystemTitleContainer>
      <div
        css={css`
          text-transform: uppercase;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0rem;
        `}
      >
        Configuration(s):
      </div>
      {configs.map((c) => (
        <Config
          key={c.id}
          config={c}
          template={template}
          removeConfig={removeConfig}
        />
      ))}
      <TextButton
        css={css`
          padding-left: 0rem;
          padding-bottom: 1.5rem;
          font-size: 1rem;
        `}
        onClick={() => addConfig(template)}
      >
        + Add Configuration
      </TextButton>
    </SystemConfigsContainer>
  );
};

const SystemConfigsContainer = styled.div`
  background-color: ${colors.extraLightBlue};
  padding: 0rem 0.75rem;
`;

interface UploadDownloadProps {
  path: string; // file path
}
const UploadDownload = ({ path }: UploadDownloadProps) => {
  const buttonCss = css`
    font-size: 0.8rem;
    color: ${colors.mediumBlue};
    padding: 0 0.5rem;
    text-transform: none;
  `;
  return (
    <Fragment>
      <FileAction>
        <TextButton css={buttonCss}>Download</TextButton>
      </FileAction>
      <FileAction>
        <TextButton css={buttonCss}>Upload</TextButton>
      </FileAction>
    </Fragment>
  );
};

const FileAction = styled.div`
  display: inline;
`;

const SystemTitleContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 1rem 0rem;
`;

const SystemName = styled.div`
  font-weight: bold;
  flex: 1;
`;

interface ConfigProps {
  config: Configuration;
  template: SystemTemplate;
  removeConfig: (config: Configuration) => void;
}

const Config = ({ config, template, removeConfig }: ConfigProps) => {
  const [inHover, setHover] = useState(false);

  return (
    <ConfigContainer
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ConfigNameEditContainer>
        <ConfigName>{config.name}</ConfigName>
        <SlideOut config={config} template={template} />
      </ConfigNameEditContainer>
      <TextButton
        css={
          inHover
            ? css`
                visibility: visible;
              `
            : css`
                visibility: hidden;
              `
        }
        onClick={() => removeConfig(config)}
      >
        X
      </TextButton>
    </ConfigContainer>
  );
};

const ConfigName = styled.div`
  flex: 1;
`;

const ConfigNameEditContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  outline: 1px solid ${colors.mediumGrey};
  width: 100%;
  padding: 0.5rem 0.9rem;
  align-items: center;
`;

const ConfigContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: 0.5rem 0rem;
`;

export default Configs;
