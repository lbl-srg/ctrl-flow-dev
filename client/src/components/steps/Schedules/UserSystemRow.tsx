import { UserSystemRowProps } from "./Types";

function UserSystemRow({ userSystem }: UserSystemRowProps) {
  console.log(userSystem.config.selections.map((item) => item.option));

  const fieldValues = userSystem.config.selections.map((selection) => {
    return {
      field: selection.parent.name,
      value: selection.option.name,
    };
  });

  return (
    <tr>
      <td>
        <pre>{JSON.stringify(fieldValues, null, 2)}</pre>
      </td>
    </tr>
  );
}

export default UserSystemRow;
