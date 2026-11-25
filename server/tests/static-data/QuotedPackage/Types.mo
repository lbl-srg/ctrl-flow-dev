within QuotedPackage;
package Types "Package with type definitions"
  extends Modelica.Icons.TypesPackage;
  type Valve = enumeration(
      'two-way'
      "Literal with a dash",
      'three.way'
      "Literal with a dot",
      '13\'H'
      "Literal with an escaped quote",
      plain
      "Unquoted literal")
    "Enumeration with quoted literals";
end Types;
