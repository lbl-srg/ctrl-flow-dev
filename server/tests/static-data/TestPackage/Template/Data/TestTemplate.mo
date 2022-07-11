within TestPackage.Template.Data;
record TestTemplate "Test Record"
  extends TestPackage.Template.Data.PartialTemplate(
    redeclare TestPackage.Template.Components.Data.TestTemplateController
    ctl(
      final typSecRel=typSecRel
    )
  );

  parameter String record_parameter="Record Parameter"
  annotation (Evaluate=true, Dialog(group="Configuration"));

  final parameter Boolean nested_bool=true;

  /*
  Test propagating UP a configuration parameter from a subcomponent
  (inner/outer declarations are not allowed in records so an explicit parameter binding is needed
  i.e. we cannot access selectable_component.container as in TestPackage.Component.ThirdComponent)
  */
  parameter TestPackage.Types.Container container_selectable_component
    "Container Type"
    annotation (Evaluate=true, Dialog(group="Configuration"));

  parameter Boolean flag_enabled(start=true)
    "Uninitialized parameter with enable attribute and start value"
    annotation(Dialog(
      enable=container_selectable_component==TestPackage.Types.Container.Bowl));
end TestRecord;
