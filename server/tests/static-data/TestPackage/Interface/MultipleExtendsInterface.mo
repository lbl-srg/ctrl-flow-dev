within TestPackage.Interface;
partial model MultipleExtendsInterface "Test Multiple Extends Interface"
  extends TestPackage.Interface.NestedExtendInterface;
  extends TestPackage.Interface.PartialComponent;
end MultipleExtendsInterface;
