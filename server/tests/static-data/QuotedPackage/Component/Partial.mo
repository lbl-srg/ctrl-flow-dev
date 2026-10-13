within QuotedPackage.Component;
partial model Partial "Interface with quoted parameters"
  parameter Boolean 'a.b'=true
    "Parameter with a dot"
    annotation (Evaluate=true, Dialog(group="Quoted"));
  parameter QuotedPackage.Types.Valve 'val-1'=QuotedPackage.Types.Valve.'two-way'
    "Enumeration parameter with a dash"
    annotation (Evaluate=true, Dialog(group="Quoted"));
  parameter Real 'k\?'=1
    "Parameter with a redundant escape, enabled by a quoted parameter"
    annotation (Dialog(group="Quoted", enable='a.b'));
end Partial;
