within TestPackage.Component;
model FifthComponent "Fifth Component"
  extends TestPackage.Interface.PartialComponent;

  replaceable parameter
    TestPackage.Component.FirstComponent replaceable_param
    "Replaceable Parameter";

end FifthComponent;