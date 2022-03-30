within TestModelicaPackage.Component;
model ThirdComponent "Third Component"
  parameter String component_param="Third Component Param"
    annotation (Evaluate=true, Dialog(group="TestGroup"));

  parameter TestModelicaPackage.Types.IceCream typ = true
    "Third Component Enum"
    annotation (
      Evaluate=true,
      Dialog(group="Configuration"));