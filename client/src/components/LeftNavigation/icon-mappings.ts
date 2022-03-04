interface IconMap {
  iconClass: string;
  systemName: string;
}

const map: IconMap[] = [
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

export default map;
