within TestPackage.Template;
model TestTemplate "Test Template"
  /*
    Test that extends work as expected
  */
  extends TestPackage.Interface.ExtendInterface(
    interface_param="Updated Value",
    nested_interface_param="Template mod of the nested param");

  /*
    Test that a subcomponent's options are added
  */
  TestPackage.Component.FirstComponent first(
    component_param="First Component Template Override")
    annotation(Dialog(enable=true));

  // Test inner/outer declaration
  inner String inner_outer_param = "inner assignment";

  /*
    Test a replacable with outer declaration
  */
  inner replaceable
    TestPackage.Component.SecondComponent
    selectable_component constrainedby
    TestPackage.Interface.PartialComponent(
      final container=TestPackage.Types.Container.Cone,
      final icecream=if
        first.icecream <> TestPackage.Types.IceCream.Chocolate then
        first.icecream elseif third.icecream <> TestPackage.Types.IceCream.Chocolate
        then third.icecream else TestPackage.Types.IceCream.Chocolate)
    "Replaceable Component"
    annotation (
      choices(
        choice(
          redeclare replaceable TestPackage.Component.SecondComponent selectable_component
          "Second Test Component"),
        choice(
          redeclare replaceable TestPackage.Component.ThirdComponent selectable_component
          "Third Test Component"),
        choice(
          redeclare replaceable TestPackage.Component.FourthComponent selectable_component(
            redeclare final TestPackage.Component.SecondComponent replaceable_param
          )
          "Fourth Test Component")
        )
      );

  /*
  Test that a subcomponent has access to an outer declaration
  */
  TestPackage.Component.ThirdComponent third(
    component_param="Third Component Template Override");

  /*
    Test Record
  */
  parameter TestPackage.Template.Data.TestTemplate dat(
    final container_selectable_component=selectable_component.container)
    "Record with additional parameters";

  /*
    Test ignore 'Final' keyword
  */
  final parameter String should_ignore="ignore me"
    "Final parameter that should be ignored"
    annotation(Dialog(group="Configuration", enable=true));

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

  // START DISABLE CONDITIONS
  // 'enable': no annotation specified, default true
  parameter Real test_real=1.0
    "Test real number";

  // disable condition: explicit disable
  parameter Integer test_int=2
    "Test Integer"
    annotation (Dialog(enable=false));

  // disable condition: 'connectorSizing=true'
  parameter Integer connector_param
    "Connector Param"
    annotation (Dialog(enable=true, connectorSizing=true));

  // enable condition: 'connectorSizing=false'
  parameter Integer connector_param_false
    "Param with connectorSizing"
    annotation (Dialog(connectorSizing=false));
  // END DISABLE CONDITIONS

  // Linkage keyword override - true to false
  parameter Integer linkage_keyword_false
    "Param to test linkage keyword override to false"
    annotation (Dialog(enable=true), __ctrlFlow(enable=false));

  parameter TestPackage.Types.IceCream typ = TestPackage.Types.IceCream.Chocolate
    "Test Enum"
    annotation (
      Evaluate=true,
      Dialog(group="Configuration"));

  // redclare modifier params
  TestPackage.Component.FourthComponent redeclare_param_01(
      redeclare final TestPackage.Component.SecondComponent replaceable_param
    )
    "First Param to test component redeclares"
    annotation(Dialog(enable=true));

  TestPackage.Component.FourthComponent redeclare_param_02(
    redeclare TestPackage.Component.ThirdComponent replaceable_param)
    "Second Param to test component redeclares"
    annotation(Dialog(enable=true));

  // path testing and redeclare modifier testing
  Component.FourthComponent short_path_component(
    redeclare FifthComponent replaceable_param
  );

  LocalVars test_record(
    local_var="Modified Value"
  );

  inner replaceable
    Component.SecondComponent
    selectable_component_with_relative_paths constrainedby
    Interface.PartialComponent(
      final container=Types.Container.Cone,
      final icecream=if
        first.icecream <> TestPackage.Types.IceCream.Chocolate then
        first.icecream elseif third.icecream <> TestPackage.Types.IceCream.Chocolate
        then third.icecream else TestPackage.Types.IceCream.Chocolate)
    "Replaceable Component"
    annotation (
      choices(
        choice(
          redeclare replaceable Component.SecondComponent selectable_component_with_relative_paths
          "Second Test Component"),
        choice(
          redeclare replaceable Component.ThirdComponent selectable_component_with_relative_paths
          "Third Test Component")),
      Dialog(group="Selectable Component"));


  // Test short class definition
  replaceable model ShortClass =
    Component.FirstComponent
    constrainedby TestPackage.Interface.PartialComponent
    "Replaceable short class"
    annotation(choices(
      choice(redeclare replaceable model ShortClass =
        TestPackage.Component.FirstComponent
        "First Test Component"),
      choice(redeclare replaceable model ShortClass =
      TestPackage.Component.SecondComponent
        "Second Test Component")));

  ShortClass shortClassInstance
    "Instance of short class";

  annotation(__ctrlFlow(routing="template"));
end TestTemplate;
