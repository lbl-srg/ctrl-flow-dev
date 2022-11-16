within TestPackage.Interface;
partial model NestedExtendInterface "Test Extend Interface"

  parameter String nested_interface_param="Nested Interface Param"
    annotation (Evaluate=true, Dialog(group="Configuration"));

  outer parameter String nested_outer_param;

  parameter String nested_assignment_of_outer_param = nested_outer_param;

end NestedExtendInterface;
