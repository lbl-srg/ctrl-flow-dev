const map = [
  {
    iconClass: "icon-ahu",
    systemName: "Ventilation, Air Handlers and Other Fans",
  },

  {
    iconClass: "icon-zone-equipment",
    systemName: "Zone equipment",
  },

  {
    iconClass: "icon-chiller-plant",
    systemName: "Chilled water plants",
  },

  {
    iconClass: "icon-boiler-plant",
    systemName: "heating plants",
  },
];

// TODO: this is gonna move into the templates store
export function findIcon(systemName) {
  if (!systemName) return null;
  const match = map.find(
    (item) => item.systemName.toLowerCase() === systemName.toLowerCase(),
  );
  return match ? match.iconClass : null;
}

export default map;
