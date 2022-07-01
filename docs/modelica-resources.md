# Modelica Resources

This is a collection of links/information to help get an overview of modelica and how it integrates with the Linkage widget.

# Modelica Templates

Modelica templates are special .mo files that have inputs to allow a component to be configured.

These templates exist in the modelica-buildings repo on the [issue1374_templates branch](https://github.com/lbl-srg/modelica-buildings/tree/issue1374_templates).

The linkage widget interacts with these templates parsed as [`modelica-json`](https://github.com/lbl-srg/modelica-json).

## Template Inputs

All examples are from the most complete template, VAVMultizone.

For additional details about template inputs refer to the requirements website for detailed information on [Parameter Dialog Annotations](https://lbl-srg.github.io/linkage.js/requirements.html#parameter-dialog-annotations).

### Variables

```modelica
/*
From Templates/AirHandlersFans/Interfaces/PartialAirHandler.mo
*/
parameter Buildings.Templates.AirHandlersFans.Types.Configuration typ
    "Type of system"
    annotation (Evaluate=true, Dialog(group="Configuration"));
```

From this parameter we extract the following:

- Input title is "Type of System"
- This is put in the 'configuration' group
- parameter type is an enum of type `Buildings.Templates.AirHandlersFans.Types.Configuration`
- NOTE: tab can also be specified, e.g. `annotation (Dialog(tab="Assumptions", group="Heat transfer"))`

Additional details on variables and how we translate into UI in [the requirements](https://lbl-srg.github.io/linkage.js/requirements.html#variables)

`final` keyword: TODO

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

TODO: `inner` keyword - does this impact traversal?

### Option Discovery

Available template selections are NOT all listed in a single file. To get the full tree of available options, extended models, subcomponents, and `record`s need to be traversed recursively.

Throughout the templates qualified names are used to reference other parameters in a modelica package. We can use these names as package relative paths to determine what other json files need to be traversed to get all available options.

> NOTE: additional details about the [lookup rules](https://mbe.modelica.university/components/packages/lookup/) related to these qualified paths.

An example modelica path:

```
"Buildings.Templates.AirHandlersFans.Interfaces.PartialAirHandler"
```

> NOTE: A [`record`](https://mbe.modelica.university/behavior/equations/record_def/) is just a collection of parameters, like a class without functions.

Doing so will generate a tree of options for the model and subcomponents.

An example of extending a model - Multizone VAV extends PartialAirHandler:

```
within Buildings.Templates.AirHandlersFans;
model VAVMultiZone "Multiple-zone VAV"
  extends Buildings.Templates.AirHandlersFans.Interfaces.PartialAirHandler(
```

### Configuraiton Types

The configuration will need to render three types of input fields:

- Replacables ('Choices')
- Booleans
- Enums

### Where to get Schedule Table Data

Templates will have a parameter pointing to a `Record`. The general pattern being followed is to name this parameter `dat`. This record will contain all related control and mechanical points for the schedule(TODO: detail control vs. mechanical points).

Within the `dat` `Record` parameters will be be structured in the following way:

- `Record dat`
  - `param1`
  - `Record subgroup1`
    - `param2`
    - `param3`
  - `Record Subgroup2`
    - `param4`
    - `param5`

The `dat` `Record` will contain sub `Record`s that group parameters together, and these sub-groupings will be what we use to organize table headings in the schedules table.

So the above listing of parameters and sub `Record`s would become:

```
                 |    subgroup1    |    subgroup2    |
        |--------|-----------------|--------|--------|
        | param1 | param2 | param3 | param4 | param5 |
|-------|--------|--------|--------|--------|--------|
| row1  |  val1  |  val2  |  val3  | val4   | val4   |
| row2  |  ...
```

### Expressions (TODO)

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

- [Modelica University](https://modelica.university/) - collection of resources for Modelica

- [Modelica by Example](https://mbe.modelica.university) -
  Nice practical introduction to modelica that incrementally walks through features in the language

- Modelica literals and Arrays:

  - [Modelica Literals](https://modelica.readthedocs.io/en/latest/lexical.html#literal-constants)
  - [Array construction and concatenation](https://modelica.readthedocs.io/en/latest/operators.html#array-constructor-operator)

- Operators and Expressions:

  - [read the docs](https://modelica.readthedocs.io/en/latest/operators.html#expressions)
  - [modelica specification: operators and expressions](https://specification.modelica.org/maint/3.5/operators-and-expressions.html) & [concrete syntax](https://specification.modelica.org/maint/3.5/modelica-concrete-syntax.html#expressions1)

- [Modelica Language Specifcation](https://specification.modelica.org/maint/3.5/introduction1.html) - in particular [operators and expressions](https://specification.modelica.org/maint/3.5/operators-and-expressions.html), also [here](https://specification.modelica.org/maint/3.5/modelica-concrete-syntax.html#expressions1).
