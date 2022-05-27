import { UserSystemRowProps } from "./Types";

function UserSystemRow({ index, groups }: UserSystemRowProps) {
  return (
    <tr>
      <td className="index-col">{index + 1}</td>
      {/* <td>{userSystem.tag}</td>
      <td>{userSystem.config.name}</td> */}

      {groups.map((group) => {
        return group.fields.map((field) => (
          <td key={`${group.groupName}-${field}`}>
            {/* {findValue(userSystem, group.groupName, field)} */}
          </td>
        ));
      })}
    </tr>
  );
}

export default UserSystemRow;
