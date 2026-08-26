within TestPackage.Component;
partial model DeadEndConstraint
  "Class referenced only in constraining clauses of dead-end replaceables: must never be parsed (#601)"
  parameter Boolean dead_constraint_param=true
    "Dead parameter";

end DeadEndConstraint;
