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
    Test that other modules are ignored
  */

  /*
    Test ignore 'Final' keyword
  */

  /*
    Test boolean
  */

end TestTemplate;