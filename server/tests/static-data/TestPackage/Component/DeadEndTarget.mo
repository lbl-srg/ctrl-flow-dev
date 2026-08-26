within TestPackage.Component;
model DeadEndTarget
  "Class referenced only as the declared/aliased type of dead-end replaceables: must never be parsed (#601)"
  parameter Boolean dead_target_param=true
    "Dead parameter";

end DeadEndTarget;
