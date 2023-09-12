# Tech Debt/Feature Implementation Overview Jan. 2023

This is a high level summary of some of the tech-debt in ctrl-flow. It is by no means exhaustive and is meant more to capture some specific items just prior to sequence-document beta testing at the beginning of 2023.

## Template Instances

When the schedule table is usable, there will be a new data type to store the values in each row. This data type needs to be introduced and be ready to be extracted using the modelica-writer.

## Setup Common Module to share code betwee FE and BE

- Share Typescript Types between FE/BE
- Share the interpreter and expression evaluator

## Modelica Standard Library Integration

- Currently their are quite a few locations in code that filter on paths beginning with `Modelica`. Once we are ready to integrate the modelica buildings library all of these filters will need to be removed

- Parser robustness will need to be improved. The parser was failing on initial attempts to parse the modelica-json representation of the Modelica Standard Library

## Adding numbers and literal strings

- Integer/Float handling will need to be integrated. There are some assumptions that we are only dealing with strings/bools/type references
- literal strings are not properly escaped. Currently the interpreter attempts to resolve strings as symbols and if it fails it just returns the string. This is a problem if a literal string mirrors a variable name.

## Modelica Writer

To correctly work with modelica-json, we'll have to write valid modelica to feed into it. Some challenges we'll need to solve:

- Writing out the correct directory structure in a way that allows modelica-json to load all the needed types
- Knowing which parameters aside from selections to use
- Setting up dynamic templates (maybe using handlebars) to write out valid modelica

## Parser TODOs

### Modifiers

It is likely a good idea to try and separate out 'Modifier' like objects that have a modelicaPath vs. those that do not. `redeclare` and `final` only relate to modifiers that have a `modelicaPath`.

### Template Discovery

The current approach is a simplistic and not very flexible. A more robust approach has been discussed:

- Use a flag indicating that a package (in our case Buildings.Templates) is to be considered as the "root" for all template URIs, for instance:
  \_\_ctrlFlow(routing="root")
- For each template class (for instance Buildings.Templates.AirHandlersFans.VAVMultiZone):
  \_\_ctrlFlow(routing="template")

> The contract for the template developer will then be that the class URI dictates the explorer tree structure, starting from the "root" package (necessarily unique inside a library).
> So for instance the template Buildings.Templates.AirHandlersFans.VAVMultiZone with the above annotation would yield the following tree structure:
>
> AirHandlersFans
>
> └── VAVMultiZone
>
> Without having to add any annotation to the subpackage Buildings.Templates.AirHandlersFans.

To implement this, the grep command can continue to be used (by changing the template identifier), however the process for finding subpackages would need to be tweaked a bit in the parser since they are not explicitly listed from the grep command.

## Confusion introduced by having a single data type `Option` instead of two

The `Option` format is confusing. It mixes the template structure with UI in a way that is hard to discern. An `Option`'s `options` can either be items to put in a dropdown, OR child options to recursively visit.

If I could redo the type, I'd change `Option` to two types, a `TemplateNode` that describes that part of the template, and `TemplateNode` would have an optional parameter `Option`, describing any UI type data for that node.
