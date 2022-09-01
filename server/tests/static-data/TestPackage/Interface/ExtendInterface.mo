within TestPackage.Interface;
partial model ExtendInterface "Test Extend Interface"
  extends TestPackage.Interface.NestedExtendInterface(
    nested_interface_param="Extend mod of nested param"
  );

  parameter String interface_param="Interface Param"
    annotation (Evaluate=true, Dialog(group="Configuration"));

end ExtendInterface;
