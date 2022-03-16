import { UserSystem } from "../../../store/store";
import { GroupedField } from "./Types";

export function groupFields(userSystem: UserSystem): GroupedField[] {
  return userSystem.scheduleList.map((list) => {
    return {
      groupName: list.group,
      fields: list.children.map((child) => child.name),
    };
  });
}

export function findValue(
  userSystem: UserSystem,
  groupName: string,
  fieldName: string,
): string {
  const groupMatch = userSystem.scheduleList.find(
    (schedule) => groupName === schedule.group,
  );

  if (groupMatch) {
    const fieldMatch = groupMatch.children.find(
      (child) => child.name === fieldName,
    );
    if (fieldMatch) return fieldMatch.value;
  }

  return "";
}
