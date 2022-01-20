export const BUS_JSON = '{"within":"Buildings.BoundaryConditions.WeatherData","class_definition":[{"class_prefixes":"expandable connector","class_specifier":{"long_class_specifier":{"identifier":"Bus","description_string":"Data bus that stores weather data","composition":{"element_list":[{"extends_clause":{"name":"Modelica.Icons.SignalBus"}}],"annotation":[{"element_modification_or_replaceable":{"element_modification":{"name":"defaultComponentName","modification":{"equal":true,"expression":{"simple_expression":"\"weaBus\""}}}}},{"element_modification_or_replaceable":{"element_modification":{"name":"Icon","modification":{"class_modification":[{"element_modification_or_replaceable":{"element_modification":{"name":"coordinateSystem","modification":{"class_modification":[{"element_modification_or_replaceable":{"element_modification":{"name":"preserveAspectRatio","modification":{"equal":true,"expression":{"simple_expression":"true"}}}}},{"element_modification_or_replaceable":{"element_modification":{"name":"extent","modification":{"equal":true,"expression":{"simple_expression":"{{-100,-100},{100,100}}"}}}}}]}}}},{"element_modification_or_replaceable":{"element_modification":{"name":"graphics","modification":{"equal":true,"expression":{"simple_expression":"{Rectangle(extent={{-20,2},{22,-2}},lineColor={255,204,51},lineThickness=0.5)}"}}}}}]}}}},{"element_modification_or_replaceable":{"element_modification":{"name":"Documentation","modification":{"class_modification":[{"element_modification_or_replaceable":{"element_modification":{"name":"info","modification":{"equal":true,"expression":{"simple_expression":"\"<html>\n<p>\nThis component is an expandable connector that is used to implement a bus that contains the weather data.\n</p>\n</html>\""}}}}},{"element_modification_or_replaceable":{"element_modification":{"name":"revisions","modification":{"equal":true,"expression":{"simple_expression":"\"<html>\n<ul>\n<li>\nJune 25, 2010, by Wangda Zuo:<br/>\nFirst implementation.\n</li>\n</ul>\n</html>\""}}}}}]}}}}]}}}}],"modelicaFile":"Buildings/BoundaryConditions/WeatherData/Bus.mo","fullMoFilePath":"/app/dependencies/modelica-buildings/Buildings/BoundaryConditions/WeatherData/Bus.mo","checksum":"abbf1bb65a3462f8c58419fe52ee0f5d"}'
export const BUS_MODELICA =`within Buildings.BoundaryConditions.WeatherData;
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
end Bus;`
