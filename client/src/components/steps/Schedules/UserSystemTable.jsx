import UserSystemRow from "./UserSystemRow";
import { groupFields } from "./helpers";

function UserSystems({ userSystems }) {
  const groups = userSystems.length > 0 ? groupFields(userSystems[0]) : [];

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th className="sticky index-col">&nbsp;</th>
            <th className="sticky">Tag</th>
            <th className="sticky">Config</th>
            {groups.map((group) => {
              return group.fields.map((field) => <th key={field}>{field}</th>);
            })}
          </tr>
        </thead>
        <tbody>
          {userSystems.map((userSystem, index) => {
            return (
              <UserSystemRow
                key={userSystem.id}
                index={index}
                userSystem={userSystem}
                groups={groups}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default UserSystems;
