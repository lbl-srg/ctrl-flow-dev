const mockData = {
  "systemTypes": [
    { "id": 1, "name": "Ventilation, Air Handlers and Other Fans" },
    { "id": 2, "name": "Zone Equipment" },
    { "id": 3, "name": "Chilled Water Plants" },
    { "id": 4, "name": "Heating Plants" },
    { "id": 5, "name": "Domestic Hot Water (DHW)" },
    { "id": 6, "name": "DHC Consumer Interface" }
  ],
  "templates": [
    {
      "id": 1,
      "name": "Multiple Zone VAV Air Handler",
      "systemType": 1,
      "options": [1, 12, 18, 28]
    },
    {
      "id": 2,
      "name": "Dual Fan Dual Duct VAV Air Handler",
      "systemType": 1,
    },
    {
      "id": 3,
      "name": "Dedicated Outdoor Air Systems",
      "systemType": 1
    },
    {
      "id": 4,
      "name": "Single Zone VAV Air Handler",
      "systemType": 1,
      "options": []
    },
    {
      "id": 30,
      "name": "Single Zone Constant Volume Air Handler",
      "systemType": 1,
      "options": []
    },
    {
      "id": 5,
      "name": "Relief Fans",
      "systemType": 1
    },
    {
      "id": 6,
      "name": "Exhaust Fans",
      "systemType": 1
    },
    {
      "id": 7,
      "name": "VAV Terminal Unit with Reheat",
      "systemType": 2,
      "options": [13, 76]
    },
    {
      "id": 8,
      "name": "VAV Terminal Unit - Cooling Only",
      "systemType": 2,
      "options": [76]
    },
    {
      "id": 9,
      "name": "VAV Dual-Duct Terminal Unit",
      "systemType": 2,
      "options": []
    },
    {
      "id": 10,
      "name": "VAV Parallel Fan Powered",
      "systemType": 2,
      "options": [13, 87, 90]
    },
    {
      "id": 11,
      "name": "Fan Coil Units",
      "systemType": 2,
      "options": []
    },
    {
      "id": 12,
      "name": "Water Source Heat Pumps",
      "systemType": 2,
      "options": []
    },
    {
      "id": 13,
      "name": "Unit Heaters",
      "systemType": 2,
      "options": []
    },
    {
      "id": 14,
      "name": "Infrared Heater",
      "systemType": 2,
      "options": []
    },
    {
      "id": 15,
      "name": "VRF Indoor Unit (Evaporator)",
      "systemType": 2,
      "options": []
    },
    {
      "id": 16,
      "name": "Split System",
      "systemType": 2,
      "options": []
    },
    {
      "id": 17,
      "name": "PTAC",
      "systemType": 2,
      "options": []
    },
    {
      "id": 18,
      "name": "Chilled Beams",
      "systemType": 2,
      "options": []
    },
    {
      "id": 19,
      "name": "Radiant Panels",
      "systemType": 2,
      "options": []
    },
    {
      "id": 20,
      "name": "Active Slabs",
      "systemType": 2,
      "options": []
    },
    {
      "id": 21,
      "name": "Baseboard Heat",
      "systemType": 2,
      "options": []
    },
    {
      "id": 22,
      "name": "Water-cooled",
      "systemType": 3,
      "options": []
    },
    {
      "id": 23,
      "name": "Air-cooled",
      "systemType": 3,
      "options": []
    },
    {
      "id": 24,
      "name": "Hot Water Plants",
      "systemType": 4,
      "options": []
    },
    {
      "id": 25,
      "name": "Steam Plants",
      "systemType": 4,
      "options": []
    },
    {
      "id": 26,
      "name": "Chilled Water Heat Echanger",
      "systemType": 6,
      "options": []
    },
    {
      "id": 27,
      "name": "Hot Water Heat Exchanger",
      "systemType": 6,
      "options": []
    },
    {
      "id": 28,
      "name": "Steam to Hot Water Heat Exchanger",
      "systemType": 6,
      "options": []
    },
    {
      "id": 29,
      "name": "Direct Connection",
      "systemType": 6,
      "options": []
    }
  ],
  "options": [
    {
      "id": 1,
      "name": "Heating Coil",
      "type": "dropdown",
      "group": "Heating coil (preheat position)",
      "options": [2, 3, 4]
    },
    { "id": 2, "type": "final", "name": "No coil" },
    {
      "id": 3,
      "type": "dropdown",
      "name": "Water coil",
      "options": [6, 7, 8, 9]
    },
    {
      "id": 4,
      "type": "dropdown",
      "name": "Steam",
      "options": [6]
    },
    {
      "id": 5,
      "name": "Electric",
      "type": "dropdown",
      "options": [10, 11]
    },
    { "id": 6, "type": "final", "name": "Two-way valve" },
    { "id": 7, "type": "final", "name": "Three-way valve" },
    { "id": 8, "type": "final", "name": "2WV with pumped coil" },
    { "id": 9, "type": "final", "name": "3WV with pumped coil" },
    { "id": 10, "type": "final", "name": "Staged" },
    { "id": 11, "type": "final", "name": "Modulating" },
    {
      "id": 12,
      "type": "checkbox",
      "name": "Relief (exhaust) fluid port",
      "group": "Configuration",
      "default": false
    },
    {
      "id": 13,
      "type": "dropdown",
      "name": "Reheat Coil",
      "group": "",
      "options": [14, 53]
    },
    {
      "id": 14,
      "type": "dropdown",
      "name": "Water coil",
      "options": [15, 16, 17]
    },
    { "id": 15, "type": "final", "name": "Two-way valve - Modulating" },
    { "id": 16, "type": "final", "name": "Two-way valve - Two-position" },
    { "id": 17, "type": "final", "name": "three-way valve" },
    {
      "id": 18,
      "type": "dropdown",
      "name": "Heat recovery",
      "options": [19, 20, 21, 22]
    },
    { "id": 19, "type": "final", "name": "No heat recovery" },
    { "id": 20, "type": "final", "name": "Plate heat exchanger" },
    { "id": 21, "type": "final", "name": "Enthalpy wheel" },
    { "id": 22, "type": "final", "name": "Run-around coil" },
    {
      "id": 23,
      "type": "dropdown",
      "name": "Outdoor air section",
      "group": "Economizer",
      "options": [24, 25, 26, 27]
    },
    { "id": 24, "type": "final", "name": "No economizer" },
    {
      "id": 25,
      "type": "final",
      "name": "Single common OA damper (modulated) with AFMS"
    },
    {
      "id": 26,
      "type": "final",
      "name": "Dedicated minimum OA damper (two-position) with differential pressure sensor"
    },
    {
      "id": 27,
      "type": "final",
      "name": "Dedicated minimum OA damper (modulated) with AFMS"
    },
    {
      "id": 28,
      "type": "dropdown",
      "name": "Exhaust/relief/return section",
      "group": "Economizer",
      "options": [24, 29, 30, 31, 32, 33]
    },
    {
      "id": 29,
      "type": "final",
      "name": "No relief fan - Barometric relief damper"
    },
    {
      "id": 30,
      "type": "final",
      "name": "No relief fan - Modulated relief damper"
    },
    {
      "id": 31,
      "type": "final",
      "name": "Relief fan - Two-position relief damper"
    },
    {
      "id": 32,
      "type": "final",
      "name": "Return fan with pressure control - Modulated relief damper"
    },
    {
      "id": 33,
      "type": "final",
      "name": "Return fan with airflow tracking - Modulated relief damper"
    },
    {
      "id": 34,
      "type": "dropdown",
      "name": "Blow-through fan",
      "group": "Fan Type",
      "options": [35, 36, 37]
    },
    { "id": 35, "type": "final", "name": "No fan" },
    { "id": 36, "type": "final", "name": "Single fan" },
    { "id": 37, "type": "final", "name": "Multiple fans (identical)" },
    {
      "id": 39,
      "type": "dropdown",
      "name": "Cooling coil",
      "group": "",
      "options": [40, 41, 42, 43]
    },
    { "id": 40, "type": "final", "name": "No coil" },
    {
      "id": 41,
      "type": "dropdown",
      "name": "Water Coil",
      "group": "",
      "options": [42, 44, 46]
    },
    { "id": 42, "type": "final", "name": "Two-way valve" },
    { "id": 43, "type": "final", "name": "Three-way valve" },
    {
      "id": 44,
      "type": "dropdown",
      "name": "Direct expansion",
      "options": [45, 46]
    },
    { "id": 45, "type": "final", "name": "Staged" },
    { "id": 46, "type": "final", "name": "Modulating" },
    {
      "id": 47,
      "type": "dropdown",
      "name": "Heating coil (reheat position)",
      "options": [48, 49, 52, 53]
    },
    { "id": 48, "type": "final", "name": "No coil" },
    { "id": 49, "type": "dropdown", "name": "Water coil", "options": [50, 51] },
    { "id": 50, "type": "final", "name": "Two-way valve" },
    { "id": 51, "type": "final", "name": "Three-way valve" },
    { "id": 52, "type": "dropdown", "name": "Steam", "options": [50] },
    { "id": 53, "type": "dropdown", "name": "Electric", "options": [54, 55] },
    { "id": 54, "type": "final", "name": "Staged" },
    { "id": 55, "type": "final", "name": "Modulating" },
    { "id": 56, "type": "dropdown", "name": "Humidifer", "options": [57, 58] },
    { "id": 57, "type": "final", "name": "Steam" },
    { "id": 58, "type": "final", "name": "Other" },
    {
      "id": 59,
      "type": "dropdown",
      "name": "Draw-through fan",
      "options": [60, 61, 62]
    },
    { "id": 60, "type": "final", "name": "No fan" },
    { "id": 61, "type": "final", "name": "Single fan" },
    { "id": 62, "type": "final", "name": "Multiple fans (identical)" },
    { "id": 63, "type": "dropdown", "name": "Controller", "options": [64] },
    {
      "id": 64,
      "type": "dropdown",
      "name": "Guideline 36",
      "options": [65, 66, 72, 73, 74, 75]
    },
    {
      "id": 65,
      "type": "checkbox",
      "name": "VAV-reheat boxes on perimeter zones"
    },
    {
      "id": 66,
      "type": "dropdown",
      "name": "Economizer changeover",
      "options": [67, 68, 69, 70, 71]
    },
    { "id": 67, "type": "final", "name": "Fixed dry bulb" },
    { "id": 68, "type": "final", "name": "Differential dry bulb" },
    {
      "id": 69,
      "type": "final",
      "name": "Fixed dry bulb + differential dry bulb"
    },
    { "id": 70, "type": "final", "name": "Fixed enthalpy + fixed dry bulb" },
    {
      "id": 71,
      "type": "final",
      "name": "Differential enthalpy + fixed dry bulb"
    },
    {
      "id": 72,
      "type": "checkbox",
      "name": "Mixed air temperature measurement enabled"
    },
    { "id": 73, "type": "checkbox", "name": "G36 freeze protection" },
    { "id": 74, "type": "enum", "name": "Energy standard" },
    { "id": 75, "type": "enum", "name": "Climate zone" },
    { "id": 76, "type": "dropdown", "name": "Controller", "options": [77] },
    {
      "id": 77,
      "type": "dropdown",
      "name": "Guideline 36",
      "options": [78, 79, 80, 81, 82, 86]
    },
    { "id": 78, "type": "checkbox", "name": "Occupancy sensor" },
    { "id": 79, "type": "checkbox", "name": "Window status sensor" },
    { "id": 80, "type": "checkbox", "name": "CO2 sensor" },
    { "id": 81, "type": "checkbox", "name": "Boiler plant request" },
    {
      "id": 82,
      "type": "dropdown",
      "name": "Local set point adjustment",
      "options": [83, 84, 85]
    },
    { "id": 83, "type": "final", "name": "No local set point adjustment" },
    { "id": 84, "type": "final", "name": "Single set point adjustment" },
    { "id": 85, "type": "final", "name": "Dual set point adjustment" },
    { "id": 86, "type": "checkbox", "name": "Demand-limit adjustment" },
    {
      "id": 87,
      "type": "dropdown",
      "name": "Fan Control",
      "options": [88, 89]
    },
    { "id": 88, "type": "final", "name": "On/Off" },
    { "id": 89, "type": "final", "name": "Modulating (ECM)" },
    { "id": 90, "type": "dropdown", "name": "Controller", "options": [91] },
    {
      "id": 91,
      "type": "dropdown",
      "name": "Guideline 36",
      "options": [78, 79]
    }
  ]
}

export default () => mockData;
