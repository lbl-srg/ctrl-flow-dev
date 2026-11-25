within ;
package UnicodePackage "Test package with non-ASCII characters in strings (MLS 3.7 §13.4)"
  model Template "Template with non-ASCII characters in strings"
    parameter Boolean have_dpLoc=true
      "Local CHW ∆p sensor"
      annotation(Dialog(group="Capteurs – débit"));
    parameter String lab="Pompe n°1"
      "Étiquette";
    annotation(__ctrlFlow(routing="template"));
  end Template;

  annotation(__ctrlFlow(routing="root"));
end UnicodePackage;
