within TestPackage.Interface;
partial model ExtendInterface "Test Extend Interface"
  extends TestPackage.Interface.NestedExtendInterface(
    nested_interface_param="Extend mod of nested param"
  );

  parameter String interface_param="Interface Param"
    annotation (Evaluate=true, Dialog(group="Configuration"));

  parameter Boolean interface_modified_bool=true
    "Interface param modified in derived classes"
    annotation (Evaluate=true, Dialog(group="Configuration", enable=true));

  parameter Boolean interface_unmodified_bool=true
    "Interface param not modified in derived classes"
    annotation (Evaluate=true, Dialog(group="Configuration", enable=true));

end ExtendInterface;
