import { UserSystemTableProps } from "./Types";
import UserSystemRow from "./UserSystemRow";

function UserSystems({ userSystems }: UserSystemTableProps) {
  return (
    <table role="grid">
      <thead>
        <tr>
          <th>Tag</th>
          <th>Config</th>
        </tr>
      </thead>
      <tbody>
        {userSystems.map((userSystem) => {
          return <UserSystemRow key={userSystem.id} userSystem={userSystem} />;
        })}
      </tbody>
    </table>
  );
}

export default UserSystems;
