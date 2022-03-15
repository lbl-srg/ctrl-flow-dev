import { UserSystemRowProps } from "./Types";

function UserSystemRow({ userSystem }: UserSystemRowProps) {
  return (
    <tr>
      <td>
        {userSystem.tag}

        {/* <pre>{JSON.stringify(userSystem, null, 2)}</pre> */}
      </td>

      <td>{userSystem.config.name}</td>
    </tr>
  );
}

export default UserSystemRow;
