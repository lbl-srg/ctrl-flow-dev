within TestPackage;
package Data "Test Record"
  extends Modelica.Icons.Package;

  record TestRecord "Test Record"
    extends Modelica.Icons.Record;

    parameter String record_parameter="Record Parameter"
    annotation (Evaluate=true, Dialog(group="Configuration"));
  
  end TestRecord;

end Data;
