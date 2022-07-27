within TestPackage.Template;
model TestTemplate "Test Template"
  /*
    Test that extends work as expected
  */
  extends TestPackage.Interface.ExtendInterface(
    interface_param="Updated Value");

  /*
    Test that a subcomponent's options are added
  */
  TestPackage.Component.FirstComponent first(
    component_param="First Component Template Override");

  /*
    Test a replacable
  */
  inner replaceable
    TestPackage.Component.SecondComponent
    selectable_component constrainedby
    TestPackage.Interface.PartialComponent(
      final container=TestPackage.Types.Container.Cone)
    "Replaceable Component"
    annotation (
      choices(
        choice(
          redeclare replaceable TestPackage.Component.SecondComponent selectable_component
          "Second Test Component"),
        choice(
          redeclare replaceable TestPackage.Component.ThirdComponent selectable_component
          "Third Test Component")),
      Dialog(group="Selectable Component"));

  /*
  Test that a subcomponent has access to an outer declaration
  */
  TestPackage.Component.ThirdComponent third_component;

  /*
    Test Record
  */
  parameter TestPackage.Template.Data.TestRecord dat(
    final container_selectable_component=selectable_component.container)
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
  parameter Boolean expression_bool=dat.nested_bool;

  // TODO: add complex value expression like below

  // final parameter Boolean have_senPreBui=
  //     secOutRel.typSecRel==Buildings.Templates.AirHandlersFans.Types.ReliefReturnSection.ReliefDamper or
  //     secOutRel.typSecRel==Buildings.Templates.AirHandlersFans.Types.ReliefReturnSection.ReliefFan or
  //     secOutRel.typSecRel==Buildings.Templates.AirHandlersFans.Types.ReliefReturnSection.ReturnFan and
  //     secOutRel.typCtlFanRet==Buildings.Templates.AirHandlersFans.Types.ControlFanReturn.BuildingPressure
  //     "Set to true if building static pressure sensor is used"
  //     annotation (Evaluate=true, Dialog(group="Configuration"));

  final parameter Boolean complex_expression_bool=
    first.container==TestPackage.Types.Container.Hand or
    first.container==TestPackage.Types.Container.Bowl or
    first.container==TestPackage.Types.Container.Cone and
    first.icecream==TestPackage.Types.IceCream.Chocolate
    "Set to true if IceCream is Chocolate with a container"
    annotation (Evaluate=true, Dialog(group="Configuration"));

  parameter String test_string_uninitialized
    "Test String that is uninitialized";

  parameter String test_string_initialized="I'm all set"
    "Test string that is initialized";

  parameter Real test_real=1.0
    "Test real number";

  parameter Integer test_int=2
    "Test Integer";

  parameter TestPackage.Types.IceCream typ = TestPackage.Types.IceCream.Chocolate
    "Test Enum"
    annotation (
      Evaluate=true,
      Dialog(group="Configuration"));
  annotation (__LinkageTemplate=true);
end TestTemplate;
