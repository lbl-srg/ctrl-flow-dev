within SecondTestPackage.Templates.Plants;
model Chiller "Chiller plant"
  final parameter SecondTestPackage.Templates.Plants.Types.Configuration typ=
    SecondTestPackage.Templates.Plants.Types.Configuration.Chiller
    "Type of system";
  parameter Boolean testParam
    "Set to true or false for testing";
  annotation (
    __ctrlFlow(routing="template"));
end Chiller;
