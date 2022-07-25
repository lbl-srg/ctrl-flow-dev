export const BUS_MODELICA = `within Buildings.BoundaryConditions.WeatherData;
expandable connector Bus
"Data bus that stores weather data"
extends Modelica.Icons.SignalBus ;

annotation (defaultComponentName="weaBus", Icon(coordinateSystem(preserveAspectRatio=true,
extent={{-100,-100},{100,100}}),
graphics={Rectangle(extent={{-20,2},{22,-2}},lineColor={255,204,51},lineThickness=0.5)}), Documentation(info="<html>
<p>
	This component is an expandable connector that is used to implement a bus that contains the weather data.
</p>

</html>", revisions="<html>
<ul>
	<li>
		June 25, 2010, by Wangda Zuo:<br/>
First implementation.
</li>
</ul>

</html>"));
end Bus;`;

export const BUS_JSON = {
	"within": "Buildings.BoundaryConditions.WeatherData",
	"class_definition": [
	  {
		"class_prefixes": "expandable connector",
		"class_specifier": {
		  "long_class_specifier": {
			"identifier": "Bus",
			"description_string": "Data bus that stores weather data",
			"composition": {
			  "element_list": [
				{
				  "extends_clause": {
					"name": "Modelica.Icons.SignalBus"
				  }
				}
			  ],
			  "annotation": [
				{
				  "element_modification_or_replaceable": {
					"element_modification": {
					  "name": "defaultComponentName",
					  "modification": {
						"equal": true,
						"expression": {
						  "simple_expression": "\"weaBus\""
						}
					  }
					}
				  }
				},
				{
				  "element_modification_or_replaceable": {
					"element_modification": {
					  "name": "Icon",
					  "modification": {
						"class_modification": [
						  {
							"element_modification_or_replaceable": {
							  "element_modification": {
								"name": "coordinateSystem",
								"modification": {
								  "class_modification": [
									{
									  "element_modification_or_replaceable": {
										"element_modification": {
										  "name": "preserveAspectRatio",
										  "modification": {
											"equal": true,
											"expression": {
											  "simple_expression": "true"
											}
										  }
										}
									  }
									},
									{
									  "element_modification_or_replaceable": {
										"element_modification": {
										  "name": "extent",
										  "modification": {
											"equal": true,
											"expression": {
											  "simple_expression": "{{-100,-100},{100,100}}"
											}
										  }
										}
									  }
									}
								  ]
								}
							  }
							}
						  },
						  {
							"element_modification_or_replaceable": {
							  "element_modification": {
								"name": "graphics",
								"modification": {
								  "equal": true,
								  "expression": {
									"simple_expression": "{Rectangle(extent={{-20,2},{22,-2}},lineColor={255,204,51},lineThickness=0.5)}"
								  }
								}
							  }
							}
						  }
						]
					  }
					}
				  }
				},
				{
				  "element_modification_or_replaceable": {
					"element_modification": {
					  "name": "Documentation",
					  "modification": {
						"class_modification": [
						  {
							"element_modification_or_replaceable": {
							  "element_modification": {
								"name": "info",
								"modification": {
								  "equal": true,
								  "expression": {
									"simple_expression": "\"<html>\n<p>\n\tThis component is an expandable connector that is used to implement a bus that contains the weather data.\n</p>\n\n</html>\""
								  }
								}
							  }
							}
						  },
						  {
							"element_modification_or_replaceable": {
							  "element_modification": {
								"name": "revisions",
								"modification": {
								  "equal": true,
								  "expression": {
									"simple_expression": "\"<html>\n<ul>\n\t<li>\n\t\tJune 25, 2010, by Wangda Zuo:<br/>\nFirst implementation.\n</li>\n</ul>\n\n</html>\""
								  }
								}
							  }
							}
						  }
						]
					  }
					}
				  }
				}
			  ]
			}
		  }
		}
	  }
	],
	"modelicaFile": "/tmp/tmp-31-7dGx3dsPp42p",
	"fullMoFilePath": "/tmp/tmp-31-7dGx3dsPp42p",
	"checksum": "0cb73b80efe3c8585fc451e4b3fd38c6"
  }
