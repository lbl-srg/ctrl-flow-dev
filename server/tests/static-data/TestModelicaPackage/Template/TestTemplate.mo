within TestPackage.Template;
model TestTemplate "Test Template"
  /*
    Test that extends work as expected
  */
  extends Interface.ExtendInterface(
    interface_param="Updated Value"
  );

  /*
    Test that a subcomponent's options are added
  */
  TestPackage.Component.FirstComponent first(
    component_param="First Component Template Override"
  );

  /*
    Test a replacable
  */
  inner replaceable
    TestPackage.Component.SecondComponent
    selectable_component constrainedby
    TestPackage.Interface.Partial(
      final container=TestPackage.Types.Container.Cone
    )
    "Second Component"
    annotation (
      choices(
        choice(
          redeclare TestPackage.Component.SecondComponent selectable_component
          "Second Test Component"
        ),
        choice(
          redeclare TestPackage.Component.ThirdComponent selectable_component
          "Third Test Component"
        )
      ),
      Dialog(group="Selectable Component")
    );

  /*
    Test Record
  */
  parameter TestPackage.Data.TestRecord dat
    "Record with additional parameters";

  /*
    Test ignore 'Final' keyword
  */
  final parameter String should_ignore="ignore me"
    "Final parameter that should be ignored"
    annotation(Dialog(group="Configuration"));

  /*
    Test boolean
  */
  parameter Boolean nullable_bool=false
    "Test boolean"
    annotation (Evaluate=true, Dialog(group="Configuration", enable=false));

  // TODO: add values for annotation variations
  // TODO: add parameters with a value assigned and for those without

  parameter TestModelicaPackage.Types.IceCream typ = true
    "Third Component Enum"
    annotation (
      Evaluate=true,
      Dialog(group="Configuration"));

end TestTemplate;