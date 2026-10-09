within QuotedPackage.Component;
model Second "Second component"
  extends QuotedPackage.Component.Partial('val-1'=QuotedPackage.Types.Valve.'13\'H');
  parameter Boolean 'only-second'=false
    "Parameter of the second component only"
    annotation (Evaluate=true, Dialog(group="Quoted"));
end Second;
