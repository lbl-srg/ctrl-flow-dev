within QuotedPackage.Template;
model QuotedTemplate "Template with quoted identifiers"
  /*
    Replaceable component with a quoted name containing a dot
  */
  replaceable QuotedPackage.Component.First 'rep.1'
    constrainedby QuotedPackage.Component.Partial
    "Replaceable component with a quoted name"
    annotation (
      choices(
        choice(
          redeclare replaceable QuotedPackage.Component.First 'rep.1'
          "First component"),
        choice(
          redeclare replaceable QuotedPackage.Component.Second 'rep.1'
          "Second component")),
      Dialog(group="Configuration"));

  /*
    Component with a quoted name containing a dash, modified through
    quoted names
  */
  QuotedPackage.Component.First 'c-d'(
    'a.b'=false,
    'val-1'=QuotedPackage.Types.Valve.'three.way')
    "Component with a quoted name"
    annotation (Dialog(enable=true));

  parameter Boolean 'with-dash'=true
    "Parameter with a dash"
    annotation (Evaluate=true, Dialog(group="Configuration"));

  /*
    Redundant escape, kept as written. MLS 2.3.1 makes 'why\?' and 'why?'
    the same identifier, but Dymola and OCT reject a reference 'why?' to
    this declaration: the references use the same spelling.
  */
  parameter Boolean 'why\?'='c-d'.'a.b'
    "Parameter with a redundant escape, bound to a quoted path"
    annotation (Evaluate=true, Dialog(group="Configuration", enable='with-dash'));

  parameter Boolean unquoted='why\?'
    "Unquoted parameter bound to a quoted parameter"
    annotation (Evaluate=true, Dialog(group="Configuration", enable='why\?'));

  parameter QuotedPackage.Types.Valve valve=QuotedPackage.Types.Valve.'13\'H'
    "Enumeration parameter with a quoted literal"
    annotation (Evaluate=true, Dialog(group="Configuration"));

  annotation(__ctrlFlow(routing="template"));
end QuotedTemplate;
