within TestModelicaPackage.Component;
model FirstComponent "First Component"
  parameter String component_param="First Component Param"
    annotation (Evaluate=true, Dialog(group="TestGroup"));