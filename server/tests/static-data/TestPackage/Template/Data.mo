within TestPackage;
package Data "Test Record"
  extends Modelica.Icons.Package;

  record TestRecord "Test Record"
    extends Modelica.Icons.Record;

    parameter String record_parameter="Record Parameter"
    annotation (Evaluate=true, Dialog(group="Configuration"));
  
    final parameter Boolean nested_bool=true;
  end TestRecord;

end Data;
