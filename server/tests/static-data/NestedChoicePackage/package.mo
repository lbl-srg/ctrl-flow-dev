within ;
package NestedChoicePackage "Test package with a nested modification in a choice, not supported (#416)"
  model Valve "Valve"
    parameter Integer typ=1
      "Type";
  end Valve;

  model Coil "Coil"
    Valve val
      "Valve";
  end Coil;

  model OtherCoil "Other coil"
    extends Coil;
  end OtherCoil;

  model Template "Template with a nested modification in a choice"
    replaceable Coil coi
      "Coil"
      annotation(choices(
        choice(redeclare replaceable NestedChoicePackage.OtherCoil coi(val(typ=2))
          "Other coil with a modified valve")));
    annotation(__ctrlFlow(routing="template"));
  end Template;

  annotation(__ctrlFlow(routing="root"));
end NestedChoicePackage;
