within TestPackage.Validation;
model TestTemplateSecondComponent
  "Validation model for TestTemplate with SecondComponent type for selectable_component"

  Template.TestTemplate testTemplate(test_string_uninitialized="Initialize string")
    annotation (Placement(transformation(extent={{-10,-10},{10,10}})));
end TestTemplateSecondComponent;
