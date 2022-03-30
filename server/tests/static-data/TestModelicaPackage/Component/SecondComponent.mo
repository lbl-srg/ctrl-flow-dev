within TestPackage.Component;
model SecondComponent "Second Component"
  parameter String component_param="Second Component Param"
    annotation (Evaluate=true, Dialog(group="TestGroup"));

  parameter Boolean is_another_param = true
    "Second Component Example Boolean Param"
    annotation(Evaluate=true);

end SecondComponent;
