within TestPackage.Component;
model DeadEndComponent
  "Class referenced only through dead-end declarations: must never be parsed (#601)"
  parameter Boolean dead_param=true
    "Dead parameter"
    annotation (Dialog(group="Dead Group", enable=true));
  parameter Real dead_real=1.0
    "Dead real";

  outer parameter Buildings.Templates.Data.AllSystems datAll
    "Project settings";

end DeadEndComponent;
