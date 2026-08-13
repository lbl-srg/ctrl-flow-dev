within TestPackage.Interface;
partial model NestedExtendInterface "Test Extend Interface"

  parameter Boolean nested_final_bool=false
    "Nested interface param hidden by a final assignment in TestTemplate"
    annotation (Evaluate=true, Dialog(group="Final Group", enable=true));

  parameter Boolean nested_hidden_group_bool=false
    "Nested interface param whose group has no displayed member"
    annotation (Evaluate=true, Dialog(group="Hidden Group", enable=true));

  parameter String nested_interface_param="Nested Interface Param"
    annotation (Evaluate=true, Dialog(group="Configuration"));

  outer parameter String nested_outer_param;

  parameter String nested_assignment_of_outer_param = nested_outer_param;

  parameter Boolean nested_interface_unmodified_bool=false
    "Nested interface param not modified in derived classes"
    annotation (Evaluate=true, Dialog(group="Configuration", enable=true));

end NestedExtendInterface;
