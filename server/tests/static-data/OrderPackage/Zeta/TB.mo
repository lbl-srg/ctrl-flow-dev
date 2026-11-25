within OrderPackage.Zeta;
model TB "Template listed first"
  parameter Boolean b=true
    "Parameter";
  annotation(__ctrlFlow(routing="template"));
end TB;
