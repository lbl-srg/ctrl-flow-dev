within TestPackage.Component;
model UnresolvableChoices
  "Replaceable alias whose choice targets cannot be resolved (#601)"
  replaceable package Medium = TestPackage.Component.MissingMedium
    "Medium selector aliasing a class with no JSON output"
    annotation (choices(
      choice(redeclare package Medium = TestPackage.Component.MissingMediumA
        "First unresolvable choice"),
      choice(redeclare package Medium = TestPackage.Component.MissingMediumB
        "Second unresolvable choice")));

  parameter Boolean live_param=true
    "Live parameter";

end UnresolvableChoices;
