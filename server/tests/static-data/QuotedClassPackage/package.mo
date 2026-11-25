within ;
package QuotedClassPackage "Test package with a quoted class identifier, not supported"
  extends Modelica.Icons.Package;

  model 'Q' "Class with a quoted identifier"
    parameter Boolean b=true
      "Parameter";
  end 'Q';

  model Template "Template instantiating a class with a quoted identifier"
    QuotedClassPackage.'Q' q
      "Component of a class with a quoted identifier";
    annotation(__ctrlFlow(routing="template"));
  end Template;

  annotation(__ctrlFlow(routing="root"));
end QuotedClassPackage;
