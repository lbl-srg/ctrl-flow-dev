const mockData = {
  "systemTypes": [
    { "id": 1, "name": "Ventilation, Air Handlers and Other Fans" },
    { "id": 2, "name": "Zone Equipment" }
  ],
  "templates": [
    {
      "id": 1, "name": "Multiple Zone VAV Air Handler",
      "systemType": 1,
      "options": [1, 2]
    },
    {
      "id": 2,
      "name": "Dual Fan Dual Duct VAV Air Handler",
      "systemType": 1,
      "options": [5, 6]
    }
  ],
  "options": [
    {
      "id": 1,
      "name": "System 1 Option Tree",
      "type": "dropdown",
      "options": [2, 5]
    },
    { "id": 2, "type": "dropdown", "options": [3, 4], "name": "Option Branch 1" },
    { "id": 3, "type": "final", "name": "Option Branch 1 Final" },
    { "id": 4, "type": "final", "name": "Option Branch 1 Final" },
    { "id": 5, "type": "dropdown", "options": [6, 7], "name": "Option Branch 2" },
    { "id": 6, "type": "final", "name": "Option Branch 2" },
    { "id": 7, "type": "final", "name": "Option Branch 2" }
  ]
}

export default () => mockData;
