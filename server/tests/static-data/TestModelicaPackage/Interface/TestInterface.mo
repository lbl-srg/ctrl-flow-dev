within TestModelicaPackage.Interface
partial model TestInterface "Test Interface"

  parameter String interface_param="Interface Param"
    annotation (Evaluate=true, Dialog(group="Configuration"));