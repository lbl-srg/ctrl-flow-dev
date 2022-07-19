within TestPackage.Template.Data;
record PartialTemplate "Record for TestTemplate Interface Class"
    extends Modelica.Icons.Record;

    replaceable parameter TestPackage.Component.Data.TestTemplateController
        ctl(final typSecRel=typSecRel)
            "Controller"
            annotation (Dialog(group="Controls"));

    parameter Boolean partialData=false
        "Partial Data Parameter"
        annotation (Evaluate=true, Dialog(group="Configuration"), enable=true);
end PartialTemplate;