within TestPackage.Interface;
partial model ExtendInterface "Test Extend Interface"

  parameter String interface_param="Interface Param"
    annotation (Evaluate=true, Dialog(group="Configuration"));

end ExtendInterface;
