within TestPackage.Interface;
partial model NestedExtendInterface "Test Extend Interface"

  parameter String nested_interface_param="Nested Interface Param"
    annotation (Evaluate=true, Dialog(group="Configuration"));

end NestedExtendInterface;
