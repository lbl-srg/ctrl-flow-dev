within OrderPackage.Zeta.Nested;
model T "Template of the nested system type"
  parameter Boolean b=true
    "Parameter";
  annotation(__ctrlFlow(routing="template"));
end T;
