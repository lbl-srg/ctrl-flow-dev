# Template Order

Specification for the order of the templates and of the system types in `templates.json`, and therefore in the client (#660).

## Motivation

The client lists system types and templates in the order of `templates.json`. On `main`, this order comes from the order in which `grep` lists the template files: it depends on the file system, not on the library.

The library author sets the order of the classes of a package: with `package.order` for a package stored as a directory, and with the order of the declarations for a package stored in a file (MLS §13.4). ctrl-flow shall follow it, as Modelica tools do.

## Grammar

`package.order` (MLS [§13.4.1](https://specification.modelica.org/maint/3.7/packages.html#directory-hierarchy-mapping)) has one `IDENT` per line. modelica-json stores its non-empty lines, untrimmed, in the property `order` of the converted `package.mo`; the property is absent if there is no `package.order`.

```
orderKey = "(" [ position { "," position } ] ")"    (one position per class, from the root package, excluded, to the class, included)
position = non-negative integer
```

## Rules

Let `R` be the root package (`__ctrlFlow(routing="root")`). A class `C` inside `R` is reached through the chain `R = P0, P1, …, Pn = C`, where `Pi+1` is declared in `Pi`. Identifiers are read with `names.ts`.

1. **Position in a package stored as a directory** (MLS §13.4.1): the index of the identifier of `Pi+1` in the `order` of `Pi`, including for classes declared in `package.mo`.
2. **Position in a class stored in a file** (MLS §13.4.2, or nested in the file of its enclosing class): the index of `Pi+1` among the class definitions of `Pi`, in the order of the source.
3. **Order key.** The order key of `C` is the sequence of the positions of `P1, …, Pn`; the one of `R` is empty.
4. **Order.** Classes are ordered by their order keys, lexicographically, a key coming before the keys it is a prefix of: depth-first, a package before its classes.
5. **Templates** (`templates` of `templates.json`) are ordered by rule 4.
6. **System types** (`systemTypes` of `templates.json`) are ordered by rule 4, applied to the packages themselves, not to their templates.
7. **Errors of `package.order`.** For each class of a chain from `R` to a template, loading fails if its enclosing package is stored as a directory and:
   - has no `package.order` (MLS §13.4.1 then leaves the order undefined): `Missing package.order in <package>`;
   - does not list it: `<ident> is not listed in the package.order of <package>`;
   - lists it more than once: `<ident> is listed more than once in the package.order of <package>`.
8. **Discovery.** A template is a class with the class annotation `__ctrlFlow(routing="template")`, stored in its own file or declared in the file of its enclosing class. The annotation is read from the modelica-json of the class. Loading fails if no template is found in the loaded package (e.g. a misspelled name): `No template (class annotation __ctrlFlow(routing="template")) in <package>`. A package of a chain needs no template of its own.
9. **Errors of the chains.** Loading fails if no root package encloses a template, if the templates are in several root packages, or if a package of a chain cannot be loaded. The message names the classes.

## Examples

**`Buildings.Templates`.** Its `order` is `UsersGuide, AirHandlersFans, Components, Plants, Utilities, ZoneEquipment, Data, Types`; the one of `ZoneEquipment` starts with `VAVBoxCoolingOnly, VAVBoxReheat`. Classes relative to `Buildings.Templates`:

| Class | Order key |
|---|---|
| `AirHandlersFans` | `(1)` |
| `AirHandlersFans.VAVMultiZone` | `(1, 0)` |
| `ZoneEquipment` | `(5)` |
| `ZoneEquipment.VAVBoxCoolingOnly` | `(5, 0)` |
| `ZoneEquipment.VAVBoxReheat` | `(5, 1)` |

`templates.json` is unchanged.

**Order other than alphabetical.** `P` lists `Zeta, Alpha`, `P.Zeta` lists `TB, TA`, and `P.Alpha` contains `T`. Templates: `P.Zeta.TB, P.Zeta.TA, P.Alpha.T`.

**Nested system types.** `P` lists `T1, Q, T3`, and `P.Q` contains `T2`. Templates: `P.T1, P.Q.T2, P.T3`. System types: `P, P.Q`.

**Package without templates of its own.** `Templates.Plants` contains no template and `Templates.Plants.HeatPumps` contains `AirToWater`. The `package.order` of both is checked; only `HeatPumps` is a system type.

**Package stored in a file.** `S.mo` declares `model B` then `model A`, both templates. Templates: `S.B, S.A`.

**Errors.** `P/package.order` missing, without `Zeta`, or with `Zeta` twice, where `P.Zeta` is on a chain: rule 7. Without `Types`, which contains no template: no error.

## Out of scope

- Nested system types in the client (#422). The loader already holds the tree that a multi-tier view of the templates needs: the classes of the chains from `R` to the templates, in the order of rule 4, each with its enclosing class and its description. Displaying it requires exporting this tree to `templates.json` (new section, specified separately, with a version bump), and listing the full chain of each template in its `systemTypes`, as [linkage-schema.md](linkage-schema.md) anticipates.
- Order of the options of a template ([ui-design-choices.md](ui-design-choices.md)), and of projects and configurations ([selection-keys.md](selection-keys.md)).

## Known limitations

- **Incomplete `package.order`.** MLS §13.4.1 makes the order tool specific if `package.order` does not list exactly the classes of the package. Only the classes of the chains are checked: the modelica-json files of the image do not hold every class of the library.
- **Spelling.** Lines of `package.order` are compared for equality: trailing white space fails rule 7.
- **Conversion.** modelica-json does not convert a `package.mo` again if only its `package.order` changed: remove the output first.
