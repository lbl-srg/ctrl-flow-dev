within TestPackage.Component;
model ThirdComponent "Third Component"
  extends
    TestPackage.Interface.Partial(
      container=TestPackage.Types.Container.Bowl
    );
  parameter String component_param="Third Component Param"
    annotation (Evaluate=true, Dialog(group="TestGroup"));

end ThirdComponent;