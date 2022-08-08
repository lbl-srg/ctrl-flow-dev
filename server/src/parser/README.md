# Modelica-JSON Parser

## Modelica-JSON and Parser Strategy

Modelica-JSON is a complete representation of the modelica grammar. This parser is narrowly focused on extracting each declaration of user input, meaning that as a default unknown shapes in modelica-json is ignored (without throwing an error).

## Structure

```
|------------------------------|
|        modelica-json         |
|------------------------------|
|           Element            | <-- Classes to wrap each declaration in modelica-json and hold all relevant details
|------------------------------|
|          Template            | <-- Helper class that interacts with `Element`s to extract linkage schema
|------------------------------|
|        Linkage-Schema        |
|------------------------------|

```

### Modelica-JSON

It is better to think of the Modelieca-JSON format as an abstract syntax tree.

### Element

TODO

### Template

TODO
