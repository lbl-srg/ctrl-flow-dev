/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment } from "react";
import styled from "@emotion/styled";

import { useStore, System, SystemType, Configuration } from "../store/store";

import { colors } from "../styleHelpers";

const LeftNav = () => {
    const { userSystems, systemTypes, configs } = useStore((state) => ({
      userSystems: state.userProjects.systems,
      systemTypes: state.systemTypes,
      configs: state.userProjects.configurations
    }));
  
    return <SystemGroupList systemTypes={systemTypes} systems={userSystems} configs={configs}/>;
};

interface SystemGroupListProps {
    systemTypes: SystemType[];
    systems: System[];
    configs: Configuration[];
  }
  
const SystemGroupList = ({ systemTypes, systems, configs }: SystemGroupListProps) => {
    return (
        <Fragment>
        {systemTypes.map((systemType) => (
            <SystemGroup
                key={systemType.id}
                systemType={systemType}
                systems={systems.filter((s) => s.systemType === systemType.id)}
                configs={configs}
            />
        ))}
        </Fragment>
    );
};

interface SystemGroupProps {
    systemType: SystemType;
    systems: System[];
    configs: Configuration[];
}

const SystemGroup = ({ systemType, systems, configs }: SystemGroupProps) => {
    return (
            <Fragment>
                <SystemTypeTitle href={`#${systemType.name}`}>
                    <h3>
                        {systemType.name}
                    </h3>
                </SystemTypeTitle>
                {systems.map((s) => 
                        <UserSystem
                            key={s.id}
                            system={s}
                            configs={configs.filter(c => c.system === s.id)}
                        />
                    )
                }
            </Fragment>
        );
};

interface SystemProp {
    system: System;
    configs: Configuration[];
}

const UserSystem = ({ system, configs }: SystemProp) => {
    return (
        <a key={system.id} href={`#${system.name}-${system.name}`} css={css`text-decoration: none;`}>
                <SystemTitle>{system.name}</SystemTitle>
                {configs.map( c => <ConfigTitle key={c.id}>{c.name}</ConfigTitle>)}
        </a>
    );
};

const SystemTypeTitle = styled.a`
    color: ${colors.mediumBlue};
    text-decoration: none;
`

const SystemTitle = styled.div`
    color: ${colors.mediumBlue};
    font-size: 1rem;
    text-decoration: none;
`

const ConfigTitle = styled.div`
    font-size: 0.8rem;
    text-decoration: none;
    padding-left: 1rem;
    color: ${colors.mediumBlue};
    font-weight: bold;
`


export default LeftNav
