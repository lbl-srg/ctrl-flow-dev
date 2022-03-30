within TestModelicaPackage;
package Types "Package with type definitions"
  extends Modelica.Icons.TypesPackage;
  type IceCream = enumeration(
      Chocolate
      "Chocolate",
      Vanilla
      "Vanilla",
      Strawberry
      "Strawberry")
    "Enumeration for ice cream types";