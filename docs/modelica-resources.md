# Modelica Resources

This is a collection of links/information to help get an overview of modelica and how it integrates with the Linkage widget.

## References

- [Modelica by Example](https://mbe.modelica.university) -
  Nice practical introduction to modelica that incrementally walks through the language

- Modelica literals and Arrays:

  - [Modelica Literals](https://modelica.readthedocs.io/en/latest/lexical.html#literal-constants)
  - [Array construction and concatenation](https://modelica.readthedocs.io/en/latest/operators.html#array-constructor-operator)

- Operators and Expressions:

  - [read the docs](https://modelica.readthedocs.io/en/latest/operators.html#expressions)
  - [modelica specification: operators and expressions](https://specification.modelica.org/maint/3.5/operators-and-expressions.html) & [concrete syntax](https://specification.modelica.org/maint/3.5/modelica-concrete-syntax.html#expressions1)

- [Modelica Language Specifcation](https://specification.modelica.org/maint/3.5/introduction1.html) - in particular [operators and expressions](https://specification.modelica.org/maint/3.5/operators-and-expressions.html), also [here](https://specification.modelica.org/maint/3.5/modelica-concrete-syntax.html#expressions1).

## Modelica Templates

The linkage widget interacts with modelica templates. These are special .mo files that have modelica annotations that include `choices` and other user provided inputs.

These templates exist in the modelica-buildings repo on the [issue1374_templates branch](https://github.com/lbl-srg/modelica-buildings/tree/issue1374_templates).

Refer to the requirements website for detailed information on [Parameter Dialog Annotations](https://lbl-srg.github.io/linkage.js/requirements.html#parameter-dialog-annotations).

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
