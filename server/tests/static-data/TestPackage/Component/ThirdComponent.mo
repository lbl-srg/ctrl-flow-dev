within TestPackage.Component;
model ThirdComponent "Third Component"
  extends
    TestPackage.Interface.PartialComponent(
      container=TestPackage.Types.Container.Cone);

  parameter String component_param="Third Component Param"
    annotation (Evaluate=true, Dialog(group="TestGroup"));

  /*
  Test that a subcomponent has access to an outer declaration
  */
  outer replaceable TestPackage.Interface.PartialComponent selectable_component;

  parameter TestPackage.Types.Container container_from_outer = selectable_component.container;

end ThirdComponent;
