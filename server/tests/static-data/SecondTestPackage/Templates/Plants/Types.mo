within SecondTestPackage.Templates.Plants;
package Types "Package with type definitions"
  extends Modelica.Icons.TypesPackage;
  type Configuration = enumeration(
      Boiler
      "Boiler plant",
      Chiller
      "Chiller plant")
    "Enumeration to configure the plant";
  end Types;
