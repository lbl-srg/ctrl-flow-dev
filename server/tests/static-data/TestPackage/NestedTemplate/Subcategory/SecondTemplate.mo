within TestPackage.NestedTemplate.Subcategory;
model SecondTemplate "Subcategory Template"
  parameter String second_template_param="2nd Template Param"
    "Second Template Parameter"
    annotation (Evaluate=true, Dialog(group="Configuration"));
  annotation (__LinkageTemplate=true);
end SecondTemplate;
