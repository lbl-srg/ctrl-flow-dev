import { UserSystemRowProps } from "./Types";

function UserSystemRow({ scheduleOptions, groups }: UserSystemRowProps) {

  let rowItems = [];

  function renderRow() {
    groups.forEach((group) => {
      let currentObj = scheduleOptions;
      const groupKeys = group.groupName.split(' > ');
      groupKeys.forEach((item, index) => {
        if (item === '' ) {
          rowItems = rowItems.concat(currentObj.options?.map((opt) => <td>{opt.name}</td>));
        } else if (groupKeys.length === index+1) {
          rowItems = rowItems.concat(currentObj[item].options?.map((opt) => <td>{JSON.stringify(opt.value)}</td>));
        } else {
          currentObj = currentObj[item];
        }
      })
    });

    return rowItems;
  }

  return (
    <tr>
      <td className="index-col">1</td>
      <td>Tag Name</td>
      <td>Config Name</td>
      {renderRow()}
    </tr>
  );
}

export default UserSystemRow;
