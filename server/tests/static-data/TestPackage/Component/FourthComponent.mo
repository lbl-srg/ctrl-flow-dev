within TestPackage.Component;
model FourthComponent "Fourth Component"
  extends TestPackage.Interface.PartialComponent;

  replaceable parameter
    TestPackage.Component.FirstComponent replaceable_param
    "Replaceable Parameter";


end FourthComponent;