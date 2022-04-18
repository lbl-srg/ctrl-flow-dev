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
  parameter TestPackage.Template.Data.TestRecord dat
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
    annotation (Evaluate=true, Dialog(group="Groupy", tab="Tabby", enable=true));

  /*
    Bool assigned by expression
  */
  final parameter Boolean expression_bool=dat.nested_bool;

  // TODO: add values for annotation variations

  parameter String test_string_uninitialized
    "Test String that is uninitialized";

  parameter String test_string_initialized="I'm all set"
    "Test string that is initialized";

  parameter Real test_real=1.0
    "Test real number";

  parameter Integer test_int=2
    "Test Integer";

  parameter TestModelicaPackage.Types.IceCream typ = TestModelicaPackage.Types.IceCream.Chocolate
    "Test Enum"
    annotation (
      Evaluate=true,
      Dialog(group="Configuration"));

end TestTemplate;