import { Fragment, useMemo } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";
import { useStores } from "../../../data";
import "../../../styles/steps/systems.scss";
import { SystemTypeInterface } from "../../../data/types";

// TODO: remove or move to data class
export function DebugSystemTypeTree({
  items,
}: {
  items: SystemTypeInterface[];
}) {
  const text = useMemo(() => {
    // Index items and prepare children buckets
    const byId = new Map(items.map((it) => [it.modelicaPath, it]));
    const children = new Map<string, SystemTypeInterface[]>();
    items.forEach((it) => children.set(it.modelicaPath, []));

    const roots: SystemTypeInterface[] = [];
    for (const it of items) {
      const pid = it.parent ?? undefined;
      if (pid && byId.has(pid)) {
        children.get(pid)!.push(it);
      } else {
        roots.push(it);
      }
    }

    // Deterministic order helps debugging
    const sortByDesc = (a: SystemTypeInterface, b: SystemTypeInterface) =>
      a.description.localeCompare(b.description);
    roots.sort(sortByDesc);
    for (const arr of children.values()) arr.sort(sortByDesc);

    // Build simple indented lines
    const lines: string[] = [];
    const indent = (n: number) => "  ".repeat(n); // 2 spaces per level
    const walk = (node: SystemTypeInterface, depth: number) => {
      lines.push(`${indent(depth)}${node.description}`);
      for (const kid of children.get(node.modelicaPath) ?? [])
        walk(kid, depth + 1);
    };
    roots.forEach((r) => walk(r, 0));
    return lines.join("\n");
  }, [items]);

  return <pre style={{ margin: 0, whiteSpace: "pre" }}>{text}</pre>;
}

const Systems = () => {
  const { templateStore } = useStores();

  return (
    <Fragment>
      <PageHeader headerText="Systems" />
      <h4>Select the systems types you will configure:</h4>

      {/* super-basic debug view */}
      <DebugSystemTypeTree items={templateStore.systemTypes} />

      <div className="systems-page">
        {templateStore.systemTypes.map((systemType: SystemTypeInterface) => (
          <System
            key={systemType.modelicaPath}
            systemPath={systemType.modelicaPath}
          />
        ))}
      </div>
    </Fragment>
  );
};

export default Systems;
