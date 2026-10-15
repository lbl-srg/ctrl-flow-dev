within OrderPackage.Zeta;
model TA "Template listed last"
  parameter Boolean b=true
    "Parameter";
  annotation(__ctrlFlow(routing="template"));
end TA;
