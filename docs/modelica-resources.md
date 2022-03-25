# Modelica Resources

This is a collection of links/information to help get an overview of modelica and how it integrates with the Linkage widget.

# Modelica Templates

Modelica templates are special .mo files that have inputs to allow a component to be configured.

These templates exist in the modelica-buildings repo on the [issue1374_templates branch](https://github.com/lbl-srg/modelica-buildings/tree/issue1374_templates).

The linkage widget interacts with these templates parsed as [`modelica-json`](https://github.com/lbl-srg/modelica-json).

## Template Inputs

All examples are from the most complete template, VAVMultizone.

For additional details about template inputs Refer to the requirements website for detailed information on [Parameter Dialog Annotations](https://lbl-srg.github.io/linkage.js/requirements.html#parameter-dialog-annotations).

### Variables

Template parameters that do not have the `final` keyword need to be exposed to the end user:

```modelica
/*
From Templates/AirHandlersFans/Interfaces/PartialAirHandler.mo
*/
parameter Buildings.Templates.AirHandlersFans.Types.Configuration typ
    "Type of system"
    annotation (Evaluate=true, Dialog(group="Configuration"));
```

From this paramter to extract three things:

- Input title is "Type of System"
- This is put in the 'configuration' group
- parameter type is an enum of type `Buildings.Templates.AirHandlersFans.Types.Configuration`
- NOTE: `Dialog(tab=<config tab)` can also be specified

Additional details on variables and how we translate into UI in [the requirements](https://lbl-srg.github.io/linkage.js/requirements.html#variables)

### Replaceable Components ('Choices')

Templates can have 'replacable' sub-components, that look as follows:

```
  inner replaceable Buildings.Templates.Components.Fans.SingleVariable fanSupDra
    constrainedby Buildings.Templates.Components.Fans.Interfaces.PartialFan(
      redeclare final package Medium = MediumAir,
      final dat=dat.fanSup,
      final have_senFlo=ctl.typCtlFanRet==
        Buildings.Templates.AirHandlersFans.Types.ControlFanReturn.AirflowTracking)
    "Supply fan - Draw through"
    annotation (
      choices(
        choice(redeclare replaceable Buildings.Templates.Components.Fans.None fanSupDra
          "No fan"),
        choice(redeclare replaceable Buildings.Templates.Components.Fans.SingleVariable fanSupDra
          "Single fan - Variable speed"),
        choice(redeclare replaceable Buildings.Templates.Components.Fans.ArrayVariable fanSupDra
          "Fan array - Variable speed")),
    Dialog(group="Supply air section",
      enable=fanSupBlo.typ==Buildings.Templates.Components.Types.Fan.None),
    Placement(transformation(extent={{172,-210},{192,-190}})));
```

[replaceables](https://mbe.modelica.university/components/architectures/replaceable/#replaceable):

> ...used to identify components in a model whose type can be changed (or “redeclared”) in the future. One way to think about replaceable is that it allows the model developer to define “slots” in the model that are either “blank” to begin with (where an interface model is the original type in the declaration) or at least “configurable”.

The annotation below with the keyword 'choices' has a list of modelica models referenced by a path (e.g. 'Buildings.Templates.Components.Fans.SingleVariable').

Upon selection, the previous 'replacable' block is replaced with a 'redeclare' block:

```
  redeclare replaceable Buildings.Templates.Components.Fans.SingleVariable
        fanSupDra,
```

TODO: `inner` keyword

### Option Discovery

Available template selections are NOT all listed in a single file. To get the full tree of available options, inherited classes and subcomponents need to be traversed recursively.

Doing so will generate a tree of options for the model and subcomponents.

NOTE: an example of extending a class, Multizone VAV extends PartialAirHandler

```
within Buildings.Templates.AirHandlersFans;
model VAVMultiZone "Multiple-zone VAV"
  extends Buildings.Templates.AirHandlersFans.Interfaces.PartialAirHandler(
```

A pseudo code for this traversal is as follows:

```python
files_to_traverse = [current_file]

def traverse_file(file):
  ''' if this file extends another file, add the file
      if a record is found, add it to files_to_traverse
      if a replacable is found, add each 'choice' to files_to_traverse, add 'choices' as a selectable option
      add each non-final parameter
  '''

while len(files_to_traverse) > 0:
  traverse_file(files_to_traverse.pop(0))
```

## Modelica-Json Tool

[`modelica-json`](https://github.com/lbl-srg/modelica-json) is able to take modelica and convert to json and back. This tool is integrated with the server but can be used as a command line tool.

For standalone use refer to the [modelica-json readme](https://lbl-srg.github.io/modelica-json/).

The tool can also be used in the container (make sure docker is installed). As an example, here's how to convert the VAVMultiZone modelica template getting converted to modelica-json:

```
# starting from the root of this repo
cd server
npm i # make sure server dependencies are installed
npm run docker:start

# get an interactive shell in the running container
npm run docker:shell

# now in the container:
cd /dependencies/modelica-json
node app.js -f /dependencies/modelica-buildings/Buildings/Templates/AirHandlersFans/VAVMultiZone.mo -o json -d out

# json outputs into the 'out' folder
```

# References

- [Modelica by Example](https://mbe.modelica.university) -
  Nice practical introduction to modelica that incrementally walks through features in the language

- Modelica literals and Arrays:

  - [Modelica Literals](https://modelica.readthedocs.io/en/latest/lexical.html#literal-constants)
  - [Array construction and concatenation](https://modelica.readthedocs.io/en/latest/operators.html#array-constructor-operator)

- Operators and Expressions:

  - [read the docs](https://modelica.readthedocs.io/en/latest/operators.html#expressions)
  - [modelica specification: operators and expressions](https://specification.modelica.org/maint/3.5/operators-and-expressions.html) & [concrete syntax](https://specification.modelica.org/maint/3.5/modelica-concrete-syntax.html#expressions1)

- [Modelica Language Specifcation](https://specification.modelica.org/maint/3.5/introduction1.html) - in particular [operators and expressions](https://specification.modelica.org/maint/3.5/operators-and-expressions.html), also [here](https://specification.modelica.org/maint/3.5/modelica-concrete-syntax.html#expressions1).
