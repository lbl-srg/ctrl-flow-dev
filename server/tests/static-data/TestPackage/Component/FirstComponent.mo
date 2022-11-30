within TestPackage.Component;
model FirstComponent "First Component"
  extends
    TestPackage.Interface.PartialComponent(
       container=TestPackage.Types.Container.Hand);
  parameter String component_param="First Component Param"
    annotation (Evaluate=true, Dialog(group="TestGroup"));

  outer parameter Buildings.Templates.Data.AllSystems datAll;

end FirstComponent;
