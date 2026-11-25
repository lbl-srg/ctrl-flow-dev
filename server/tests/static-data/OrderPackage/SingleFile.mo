within OrderPackage;
package SingleFile "Package stored in a file, ordered by declarations"
  model B "Template declared first"
    parameter Boolean b=true
      "Parameter";
    annotation(__ctrlFlow(routing="template"));
  end B;

  model A "Template declared last"
    parameter Boolean b=true
      "Parameter";
    annotation(__ctrlFlow(routing="template"));
  end A;
end SingleFile;
