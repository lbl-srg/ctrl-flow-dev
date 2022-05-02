within TestPackage.Validation;
model TestTemplateThirdComponent
  "Validation model for with ThirdComponent type for selectable_component"

  Template.TestTemplate testTemplate(redeclare
      TestPackage.Component.ThirdComponent selectable_component
      "Third Test Component",
      test_string_uninitialized="Initialize string")
    annotation (Placement(transformation(extent={{-10,-10},{10,10}})));
end TestTemplateThirdComponent;
