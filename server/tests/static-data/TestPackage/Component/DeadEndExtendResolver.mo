within TestPackage.Component;
model DeadEndExtendResolver
  "Lexical resolution through a dead-ended base class parsed via a live route (#601)"
  extends TestPackage.Interface.PartialComponent
    annotation (__ctrlFlow(enable=false));

  parameter TestPackage.Types.IceCream local_ref=icecream
    "References a parameter of the dead-ended base class";

end DeadEndExtendResolver;
