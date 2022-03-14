import { UserSystemTableProps } from "./Types";
import UserSystemRow from "./UserSystemRow";

function UserSystems({ userSystems }: UserSystemTableProps) {
  return (
    <table>
      <thead></thead>
      <tbody>
        {userSystems.map((userSystem) => {
          return <UserSystemRow key={userSystem.id} userSystem={userSystem} />;
        })}
      </tbody>
    </table>
  );
}

export default UserSystems;
