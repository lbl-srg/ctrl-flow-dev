within TestPackage.Component;
partial model PartialComponent
  "Interface for Test Components"

  parameter TestPackage.Types.Container container
    "Container Type"
    annotation (Evaluate=true, Dialog(group="Configuration"));
end PartialComponent;
