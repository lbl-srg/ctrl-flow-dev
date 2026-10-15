within OrderMissingPackage;
model T "Template"
  parameter Boolean b=true
    "Parameter";
  annotation(__ctrlFlow(routing="template"));
end T;
