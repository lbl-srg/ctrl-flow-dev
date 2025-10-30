import System from "./System";
import itl from "../../translations";
import { useStores } from "../../data";

import "../../styles/components/left-navigation.scss";
import { SystemTypeInterface } from "../../data/types";

export interface SystemTypeTreeNode {
  id: string;
  item: SystemTypeInterface;
  children: SystemTypeTreeNode[];
}

function SystemNode({
  node,
  depth,
}: {
  node: SystemTypeTreeNode;
  depth: number;
}) {
  return (
    <div>
      <div className="title truncate" style={{ paddingLeft: depth * 16 }}>
        {node.item.description}
      </div>
      <div>
        {node.children.map((child) =>
          child.children.length === 0 ? (
            <System
              key={child.item.modelicaPath}
              systemPath={child.item.modelicaPath}
            />
          ) : (
            <SystemNode key={child.id} node={child} depth={depth + 1} />
          ),
        )}
      </div>
    </div>
  );
}

const LeftNav = () => {
  const { templateStore } = useStores();
  const forest = templateStore.getSystemTypeForest();

  return (
    <div className="left-nav">
      <h4>{itl.terms.systems}</h4>
      {forest.map((node) => (
        <SystemNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
};

export default LeftNav;
