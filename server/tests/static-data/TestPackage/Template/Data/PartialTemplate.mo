within TestPackage.Template.Data;
record PartialTemplate "Record for TestTemplate Interface Class"
    extends Modelica.Icons.Record;

    parameter Boolean partialData=false
        "Partial Data Parameter"
        annotation (Evaluate=true, Dialog(group="Configuration"), enable=true);
end PartialTemplate;