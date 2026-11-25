within TestPackage.Component;
model DeadEndUser
  "Exercises dead-end extends clauses and short class definitions (#601)"
  extends TestPackage.Component.DeadEndComponent
    annotation (__ctrlFlow(enable=false));

  model DeadAlias = TestPackage.Component.DeadEndComponent
    "Dead-end short class alias"
    annotation (__ctrlFlow(enable=false));

  // Dead-end replaceables (#601): neither the declared/aliased type nor the
  // constraining type may be parsed
  replaceable TestPackage.Component.DeadEndTarget dead_replaceable_unconstrained
    "Dead-end replaceable component without constraining clause"
    annotation (__ctrlFlow(enable=false));

  replaceable TestPackage.Component.DeadEndTarget dead_replaceable_constrained
    constrainedby TestPackage.Component.DeadEndConstraint
    "Dead-end replaceable component with constraining clause"
    annotation (__ctrlFlow(enable=false));

  replaceable model DeadAliasUnconstrained =
    TestPackage.Component.DeadEndTarget
    "Dead-end replaceable short class without constraining clause"
    annotation (__ctrlFlow(enable=false));

  replaceable model DeadAliasConstrained =
    TestPackage.Component.DeadEndTarget
    constrainedby TestPackage.Component.DeadEndConstraint
    "Dead-end replaceable short class with constraining clause"
    annotation (__ctrlFlow(enable=false));

  parameter Boolean live_param=true
    "Live parameter";

end DeadEndUser;
