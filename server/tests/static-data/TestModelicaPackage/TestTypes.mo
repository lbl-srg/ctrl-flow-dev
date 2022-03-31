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

  type Container = enumeration(
    Hand
    "Hand",
    Bowl
    "Bowl",
    Cone
    "Cone")
    "Enumeration for container types";

end Types;