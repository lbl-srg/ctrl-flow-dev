within TestPackage.Template;
model TestTemplate "Test Template"
  /*
    Test that extends work as expected
  */
  extends Interface.TestInterface(
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