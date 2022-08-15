within TestPackage.Component.Data;
record TestTemplateController "Controller"
    extends Modelica.Icons.Record;

    parameter Buildings.Templates.AirHandlersFans.Types.ReliefReturnSection typSecRel
        "Relief/return air section type"
        annotation (Evaluate=true, Dialog(group="Configuration", enable=true));

end TestTemplateController;
