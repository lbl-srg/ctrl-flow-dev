import { UserSystemTableProps, GroupedFields } from "./Types";
import UserSystemRow from "./UserSystemRow";

// const export function groupScheduleOptions(scheduleOptions): GroupedFields[] {

// }

function UserSystems({ scheduleOptions }: UserSystemTableProps) {
  // const groups = userSystems.length > 0 ? groupFields(userSystems[0]) : [];

  const groups: GroupedFields[] = [];
  createGroupedFields(scheduleOptions, '');

  function createGroupedFields(obj: any, name: string) {
    const objKeys = Object.keys(obj).filter((e) => e !== 'options');
    groups.push({
      groupName: name,
      fields: obj.options?.map((opt) => opt.name),
    });
    if (objKeys.length) {
      objKeys.forEach((key) => {
        createGroupedFields(obj[key], name ? `${name} > ${key}` : key);
      });
    }
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th className="sticky" colSpan="1">&nbsp;</th>
            <th className="sticky" colSpan="1">&nbsp;</th>
            <th className="sticky" colSpan="1">&nbsp;</th>
            {groups.map((group) => {
              return <th key={`header-${group.groupName}`} colSpan={group.fields?.length.toString()}>{group.groupName}</th>;
            })}
          </tr>
          <tr>
            <th className="sticky index-col">&nbsp;</th>
            <th className="sticky">Tag</th>
            <th className="sticky">Config</th>
            {groups.map((group) => {
              return group.fields?.map((field) => <th key={`${group.groupName}-${field}`}>{field}</th>);
            })} 
          </tr>
        </thead>
        <tbody>
          <UserSystemRow
            scheduleOptions={scheduleOptions}
            groups={groups}
          />
        </tbody>
      </table>
    </div>
  );
}

export default UserSystems;
