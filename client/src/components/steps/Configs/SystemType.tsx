import { SystemTypeProps } from "./Types";
import { Fragment } from "react";
import { useStore } from "../../../store/store";

function System({ systemType }: SystemTypeProps) {
  const { templates } = useStore((state) => ({
    templates: state
      .getActiveTemplates()
      .filter((tpl) => tpl.systemType.id === systemType.id),
  }));

  return (
    <li>
      <span>{systemType.name}</span>
      <ul>
        {templates.map((tpl) => (
          <li key={tpl.id}>{tpl.name}</li>
        ))}
      </ul>
      <hr />
    </li>
  );
}

export default System;
