# Selection Keys

Specification for the keys used to store configuration values (`selections`, `evaluatedValues`) and to exchange them with the sequence document pipeline. Supersedes the declaring-class keys described in [#620](https://github.com/lbl-srg/ctrl-flow-dev/issues/620).

## Motivation

On `main`, a key is `<declaringClass>-<instancePath>`, where `declaringClass` is the class where the parameter is declared. Two templates that redeclare the same instance path to different classes sharing a base class produce the same key, so their values are merged when configurations of different templates are combined (#620).

The key must instead identify an element unambiguously across all templates, so that:

- consumers (sequence document, future Modelica export, future record ⇄ Excel converter) can address a value without implementing template-scoping logic;
- a key translates directly into a Modelica class modification.

## Grammar

All design choices comply with the [Modelica Language Specification 3.7](https://specification.modelica.org/maint/3.7/MLS.html) (MLS). `IDENT` and `name` are as defined in MLS [§2.3](https://specification.modelica.org/maint/3.7/lexical-structure.html#identifiers-names-and-keywords) and [appendix A](https://specification.modelica.org/maint/3.7/modelica-concrete-syntax.html):

```
key         = rootClass "-" elementPath
rootClass   = className      (fully qualified name of the class to extend, without leading "."; see Resolution rules)
elementPath = elementName    (path of the element relative to rootClass)

className   = C-IDENT { "." C-IDENT }
elementName = { E-IDENT "." } ( E-IDENT | C-IDENT )   (the last identifier is a class only for a short class element, see rule 4)
C-IDENT     = NON-DIGIT { DIGIT | NON-DIGIT }          (class identifier: IDENT without Q-IDENT)
E-IDENT     = NON-DIGIT { DIGIT | NON-DIGIT } | Q-IDENT (component identifier: IDENT)
Q-IDENT     = "'" { Q-CHAR | S-ESCAPE } "'"
```

Examples:

| Declaration | Key |
|---|---|
| `parameter Boolean have_reqNeeCoo` in component `ctl` of template `Buildings.Templates.ZoneEquipment.VAVBoxReheat` | `Buildings.Templates.ZoneEquipment.VAVBoxReheat-ctl.have_reqNeeCoo` |
| `parameter Boolean 'with-dash'` in template `P.A` | `P.A-'with-dash'` |
| `parameter Boolean 'a.b'` in component `'c-d'` of template `P.A` | `P.A-'c-d'.'a.b'` |
| `parameter Boolean 'with-dash'` in template `P.'A'` | not supported (quoted class identifier) |

- **Why not `rootClass.elementPath`.** In Modelica, `A.c` only references an element of `A` if `A` is a package. Templates are models: their components have no formal path until instantiated. The dotted form is therefore not a valid Modelica reference, and it cannot be split without looking up which prefix is a class.
- **Quoted component identifiers.** The single quotes are part of the identifier: `'x'` and `x` are distinct identifiers (MLS §2.3.1), hence distinct keys. Quotes are never added or removed.
- **No quoted class identifiers.** MLS allows `Q-IDENT` for classes, but a quoted class cannot be stored with the directory hierarchy mapping (MLS §13.4.1): `'Test'.mo` and `Test.mo` are the same file name. Tools fall back to storing such a class in the enclosing `package.mo`. This dead angle of the specification is not supported. A quoted identifier anywhere in a class name (template, class of a component, short class, redeclared class, enumeration type) is rejected with an explicit error by the server parser, and keys containing one are invalid. Values are never silently misinterpreted.
- **Mapping to Modelica.** `rootClass` is the class to extend; `elementPath` is the name of the modified element in the class modification. The attributes of the value (see Values) give the kind of modification, without any lookup:

  | Key | Value | Modelica |
  |---|---|---|
  | `T-a.b.p` | `{ "value": true }` | `extends T(a(b(p=true)))` |
  | `T-a.b` | `{ "redeclare": "P.C" }` (replaceable component) | `extends T(a(redeclare P.C b))` |
  | `T-a.S` | `{ "redeclare": "P.C", "kindOfClass": "model" }` (replaceable short class `S`) | `extends T(a(redeclare model S = P.C))` |
  | `T-a.b` and `T-a.b.p` | `{ "redeclare": "P.C" }`, `{ "value": true }` | `extends T(a(redeclare P.C b(p=true)))` |

  Keys sharing a prefix are written as one nested modifier, and the modifications of the elements of a redeclared component go into its redeclaration, as in the last row. This is the merged form defined by MLS §7.2.4.

## Parsing

`rootClass` contains no `Q-IDENT`, hence no `-`: the first `-` of a key always separates `rootClass` from `elementPath`.

A component `Q-IDENT` may contain `.`, `-` and escaped quotes (`'13\'H'`). Names that may contain component identifiers (`elementPath`, option `modelicaPath`s of components, instance paths) are therefore never split with a plain string split. A single scanner tokenizes them:

1. Outside a `Q-IDENT`, `'` opens a `Q-IDENT` and `.` separates identifiers.
2. Inside a `Q-IDENT`, `\` escapes the next character (so `\'` does not close the identifier) and `'` closes it.
3. A key is invalid if it has no `-`, if `rootClass` does not match `className`, if a `Q-IDENT` is not closed, or if `elementPath` does not match `elementName`.

**Escapes are kept as written.** MLS §2.3.1 states that the redundant escapes `\?` and `\"` are the same as `?` and `"`, so `'a\?'` and `'a?'` would be the same identifier. Dymola and OCT treat them as distinct identifiers: they reject a reference `'a?'` to a declaration `'a\?'`. Keys use the spelling of the declaration, so that the modifications written from them are accepted by these tools, and remain valid under the MLS. A source that spells the same identifier in different ways is not supported (see Known limitations).

The same scanner provides the name helpers (split into identifiers, last identifier, enclosing name). They replace every plain `split(".")` and `split("-")` applied to Modelica names in the client (interpreter, display mapping, modifier and expression helpers), the server parser, and the sequence document pipeline (Python port of the scanner).

## Values

A key holds an assignment, a redeclaration, or both, in separate attributes named as in `templates.json` (#495): `value` as the `value` of an option, `redeclare` as the `redeclare` of a modifier.

```
value       = Boolean | number | string | enumLiteral
redeclare   = className
kindOfClass = class-prefixes without "partial" (MLS appendix A), e.g. "model", "record", "package", "expandable connector"
enumLiteral = className "." E-IDENT      (enumeration type, then literal: quoted literals are supported)
```

| Element | Attributes | Example |
|---|---|---|
| Replaceable component | `redeclare`: class of the component | `{ "redeclare": "Buildings.Templates.Components.Coils.WaterBasedHeating" }` |
| Replaceable short class | `redeclare`: class of the short class; `kindOfClass` | `{ "redeclare": "P.C", "kindOfClass": "model" }` |
| Enumeration parameter | `value`: `enumLiteral` | `P.Types.Valve.TwoWayModulating`, `P.Types.Valve.'two-way'` |
| Other parameters | `value`: Boolean, number, or string | `true`, `0.7` |
| Replaceable record with a binding (`redeclare R rec = localRec`) | `redeclare` and `value` | not produced by the configuration panel today |

- **Kind of modification.** The attributes are set from the declaration of the element when the value is written to the stores. They are never inferred from the value.
- **`kindOfClass`** is present if and only if the redeclared element is a class (short class element), and absent for a component. It holds the class prefixes of the replaceable class declaration (the specialized class keyword, MLS §4.7, with its `operator`, `expandable`, `pure` or `impure` prefix), i.e. the prefixes repeated in the redeclaration: `redeclare <kindOfClass> S = P.C`. With it, the payload is sufficient to write the modification without looking up `templates.json`.
- **Consumers that only need values.** The MBL templates bind a `typ` parameter in every class that can be redeclared (type introspection: Modelica has no `isOfType()`, its type system being structural). Consumers that do not write Modelica, such as the sequence document, read `value` only, through these `typ` parameters (see Mappings).

- **Enumeration literals** may be quoted (`type Valve = enumeration('two-way', threeWay)`), but the enumeration type must not be (see the quoted class identifier rule). The literal is the last identifier of the value, extracted with the scanner. `P.Types.Valve.'two-way'` and `P.Types.Valve.two_way` are distinct values.
- **Spelling.** Quoted literals are kept as written, like quoted component identifiers (see Parsing): values compare equal (client `==`, mogrifier `EQUALS`/`ANY`/`NOT_EQUALS`) if the source spells the literal consistently.
- **Recognizing a value as a name.** `isValidModelicaName` and `isFullyQualifiedName` accept a trailing quoted identifier, so a quoted literal is resolved as an enumeration value and not parsed as a string literal.

## Resolution rules for `elementPath`

`elementPath` is the **resolved** path, i.e., the path returned by `resolvePaths`:

1. **Inner/outer.** An `outer` component is a reference to the `inner` component with the same name in an enclosing instance (MLS §5.4). The elements of the referenced component can only be modified at the `inner` declaration, so they are keyed there:
   - **`inner` declared in the template.** The path is rewritten with `template.pathModifiers`, which the parser builds by mapping the path of each `outer` component to the path of its `inner`. In `Buildings.Templates.AirHandlersFans.VAVMultiZone`, the controller `ctl` holds an `outer` reference to the coil `coiCoo` (`inner replaceable … coiCoo`), and `pathModifiers` holds `ctl.coiCoo → coiCoo`. The parameter `ctl.coiCoo.typ` is keyed `Buildings.Templates.AirHandlersFans.VAVMultiZone-coiCoo.typ`.
   - **`inner` declared outside the template.** This is the case of `datAll` (`outer parameter Buildings.Templates.Data.AllSystems datAll` in the controllers), whose `inner` is declared once in the model that instantiates all the configurations of a project. `rootClass` is then the class of the `outer` declaration, and the value is a project-level value (`project.values`): `ctl.datAll.stdEne` is keyed `Buildings.Templates.Data.AllSystems-stdEne`. The Modelica export writes it into the project data record: `extends Buildings.Templates.Data.AllSystems(stdEne=…)`.
2. **Record bindings.** A parameter reached through a bound record (`mod(rec=localRec)` or `Rec rec = localRec`) is keyed at the binding target (`localRec.p`, not `mod.rec.p`), which is the only place the value can be modified.
3. **Replaceable components.** The choice is keyed at the component: `T-coiHea`.
4. **Replaceable short classes.** The choice is keyed at the short class element, in the scope of the class that declares it: `T-<scope>.<ShortClassName>`, or `T-<ShortClassName>` when declared in the template itself (no leading dot). One key sets the type of every instance declared with that short class in that scope.
5. **No array subscripts.** `elementPath` is a `name`, as the target of an `element-modification` (MLS appendix A), not a `component-reference`. Array components are modified as a whole (array value, or `each`).

## Invariants

- **Unique.** Within a configuration there is at most one key per element. Changing the type of a replaceable element overwrites the same key.
- **Computable without option lookup.** A key is built from `(templatePath, resolved elementPath)` only, and parsed with the scanner above, without any class or option lookup. A single module provides `selectionKey(rootClass, elementPath)` and `parseSelectionKey(key)`, along with the name helpers; no other code concatenates or splits keys or names.
- **Same key space for reads and writes.** The UI (`OptionSelect`/`SlideOut`), the interpreter (`getValue`, `effectiveClass`, `isValidSelection`) and `getEvaluatedValues` all use `selectionKey`.

## Interpreter structure

`_instancePathToOption` and `getReplaceableType` are replaced by small functions with a single responsibility each. They are the only implementations of their concern in the client.

| Function | Responsibility |
|---|---|
| `names.ts` | Quote-aware name helpers (see Parsing). |
| `selectionKey.ts` | `selectionKey(rootClass, elementPath)`, `parseSelectionKey(key)`. |
| `applyPathModifiers(path, pathModifiers)` | Inner/outer rewriting. |
| `memberOption(classPath, name, ctx)` | Declared or inherited element `name` of class `classPath`, or `null`. The template is handled like any other class. |
| `effectiveClass(path, declaredOption, ctx)` | Class of the element at `path` (see below). |
| `bindingRedirect(path, option, ctx)` | Rewritten path if the element at `path` is reached through a record binding (rule 2), or `null`. |
| `resolveInstance(path, ctx)` | Walks `path` one identifier at a time: `memberOption`, then `bindingRedirect`, then `effectiveClass`. Returns `{ optionPath, classPath, resolvedPath, outerOptionPath }`, or `null` if any identifier cannot be resolved. |

### `effectiveClass`

The class of the element at `path`, declared by `declaredOption`, is the first of:

1. the user selection `selections[selectionKey(templatePath, path)]` (the outermost redeclaration: `extends T(…(redeclare C …))`);
2. the redeclaration in `ctx.mods[path]` (from the template and its classes);
3. the declared type of `declaredOption`.

If the result is a short class, the short class element is resolved the same way (rule 4), and the alias chain is followed to a long class definition. The special case for `datAll` (`Buildings.Templates.Data.AllSystems`) is handled here and nowhere else.

Every computation of an element's class uses `effectiveClass`: `resolveInstance`, `buildMods`, `getOptionInstance`, and the display mapping (`_formatDisplayItem`).

### `resolveInstance`

- `resolvedPath` is the `elementPath` used in keys (rules 1 and 2).
- An identifier that cannot be resolved yields `null`. On `main`, `_instancePathToOption` instead returns the path of the enclosing class (`interpreter.ts:342-344`), which is a silently wrong answer.
- Results are cached per `ConfigContext`, by path prefix. This is valid because a context is rebuilt whenever a selection changes.

## Stores

- `config.selections`: values entered by the user. This is the only source of the class modification of an exported configuration class.
- `config.evaluatedValues`: values derived by the interpreter, same key space. Never written to the class modification. Records derived from a configuration use them: the configuration record holds the evaluated `cfg.*` values as `final` modifications (see [ModelicaExport](https://github.com/AntoineGautier/ModelicaExport), `UserProject.*.Configuration`).
- `project.selections`, `project.evaluatedValues`: project-level values, keyed `Buildings.Templates.Data.AllSystems-<elementPath>` (rule 1). On `main` they are keyed `Buildings.Templates.Data.AllSystems.<name>` (`EditDetailsModal`, interpreter, mappings).
- **Value objects.** All four stores map each key to `{ value?, redeclare?, kindOfClass? }`: the value objects of the payload without `origin`, which is given by the store. The attributes are set once, when the value is written, by the code that holds the option of the element (`SlideOut` and `EditDetailsModal` for selections, `getEvaluatedValues` for evaluated values). Every reader (interpreter, display mapping, payload builder) takes them from the stores. This supersedes the flat selection schema of #495.
- **Persistence.** No migration: the local storage key includes the client version, which is bumped on every build.
- **Projects.** Every configuration belongs to exactly one existing project:
  - `ConfigInterface.projectId` (required) is set by `configStore.add()` to the active project id.
  - Queries and bulk removals of the config store (`getConfigsForProject`, `getConfigsForSystemTemplate`, `getActiveConfigs`, `hasSystemTemplateConfigs`, `removeAllForSystemTemplate`) are scoped to a project, the active one by default. Operations by configuration `id` (a UUID) are not scoped.
  - Removing a project removes its configurations (`removeAllForProject`). Saving the project details, which discards the configurations of the project, uses it too.
  - The active project is persisted as soon as it is created. Otherwise its id, generated at page load, would change on reload, leaving its configurations without a project.
  - Once both stores are hydrated, a configuration whose `projectId` matches no project is reassigned to the project if there is exactly one, and reported otherwise. It is never silently dropped.

## Payload

The payload is the exchange format between the client and every consumer (sequence document today; Modelica export and record ⇄ Excel converter in the future). It is designed for several projects, each with several configurations, possibly of the same template.

```json
{
  "schemaVersion": 1,
  "meta": {
    "ctrlFlow": "0.1.35",
    "libraries": { "Buildings": "<version>" }
  },
  "options": { "deleteInfoBox": false },
  "projects": [
    {
      "id": "6f0c…",
      "description": "Office building",
      "values": {
        "Buildings.Templates.Data.AllSystems-stdEne": {
          "value": "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1",
          "origin": "user"
        }
      },
      "configurations": [
        {
          "id": "a41e…",
          "description": "Perimeter boxes",
          "quantity": 12,
          "systemType": "Buildings.Templates.ZoneEquipment",
          "template": "Buildings.Templates.ZoneEquipment.VAVBoxReheat",
          "values": {
            "Buildings.Templates.ZoneEquipment.VAVBoxReheat-coiHea": { "redeclare": "Buildings.Templates.Components.Coils.ElectricHeating", "origin": "user" },
            "Buildings.Templates.ZoneEquipment.VAVBoxReheat-coiHea.typ": { "value": "Buildings.Templates.Components.Types.Coil.ElectricHeating", "origin": "evaluated" },
            "Buildings.Templates.ZoneEquipment.VAVBoxReheat-ctl.have_occSen": { "value": true, "origin": "user" },
            "Buildings.Templates.ZoneEquipment.VAVBoxReheat-ctl.have_CO2Sen": { "value": false, "origin": "evaluated" }
          }
        }
      ]
    }
  ]
}
```

### Rules

- **Addresses.** A value is addressed by `(project.id, configuration.id, key)`, or `(project.id, key)` for project-level settings. This address is unambiguous across projects, configurations and templates. Keys are unique within a `values` object, so each key holds a single value.
- **Identifiers.** `id`s are the UUIDs of the client stores, stable across sessions.
- **Descriptions.** `description` is the label entered by the user (configuration name and project name in the UI). It is not required to be unique, is never used as an identifier, and becomes the description string of the exported class or package.
- **Reserved: `name`.** In Modelica, a name is an identifier. `name` is reserved for the simple name of the exported class (configuration) or package (project): an `IDENT`, unique within the enclosing package (`<project>.<last identifier of systemType>` for a configuration). It will be added with the Modelica export, together with an input field.
- **Value attributes.** Each key maps to an object, never to a bare value, so that attributes can be added without breaking consumers:
  - `value`, `redeclare`, `kindOfClass`: see Values. At least one of `value` and `redeclare` is present. There are no `null` values: an element without a value is absent.
  - `origin` (required): `"user"` for a value entered by the user (`selections`), `"evaluated"` for a value derived by the interpreter (`evaluatedValues`). When both exist, the user value wins. The class modification of an exported configuration class is made of `"user"` values only (see Stores).
  - Further attributes (unit, bounds, description, etc.) may be added; consumers ignore attributes they do not know.
- **Payload-wide attributes** go in `meta` (versions of ctrl-flow and of the libraries the templates were generated from), never on each value.
- **Consumer options** go in `options`. They are not Modelica values. `deleteInfoBox` replaces `DEL_INFO_BOX`.
- **Not keys.** The system type and the template of a configuration are fields of the configuration, not keys.
- **Versioning.** `schemaVersion` is an integer, incremented on any breaking change. Adding optional attributes or fields is not breaking. Consumers reject a payload whose `schemaVersion` they do not support.
- **Order.** `projects` and `configurations` follow the order of the client stores.

## Sequence document

### Scope

A sequence document covers one project. The sequence endpoint rejects a payload that does not contain exactly one project, until generating documents for several projects is specified.

### Aggregation

Toggles evaluate over the values of a project, gathered across its configurations:

- **System type** (e.g. `VAV` → `Buildings.Templates.ZoneEquipment`): the set of `template`s of the configurations with that `systemType`.
- **Key pattern** (see Mappings): the union of the `value`s of the matching keys in all configurations. Both origins are used, as on `main`.
- **Project-level setting**: the `value` in `project.values`.

This reproduces the merge done by the client on `main`. Merging now happens in the mogrifier, where toggle expressions covering several templates configured differently will be added later.

### Mappings

The `Modelica Parameter` column of the mappings file holds a key, or a **key pattern** listing several classes:

```
pattern      = selector "-" elementPath
selector     = className | [ className "." ] "{" alternatives "}"
alternatives = className { "|" className }
```

A pattern is shorthand for the set of keys obtained by expanding the alternatives, e.g. `P.{A|B}-c.p` stands for `P.A-c.p` and `P.B-c.p`. Each expanded `rootClass` is a class where `elementPath` is declared (a template, or `Buildings.Templates.Data.AllSystems`), never an enclosing package. `{`, `|` and `}` cannot occur in a class name (no quoted class identifiers), so the expansion is unambiguous. Keys are then matched by equality. A test checks that every expanded key resolves in its template.

The mogrifier evaluates a toggle against the union of the values of all keys of the pattern. A condition on a subset of templates is expressed by the alternatives, or by a new mapping entry.

The `Current G36 Decisions` mappings are rewritten so that the generated document is unchanged:

- Each pattern lists the templates whose values are merged today.
- Project-level settings use the keys of rule 1.
- The five entries that read the class of a replaceable component (`PREHEAT`, `REHEAT`, `COOL`, `OA`, `TERM_HT`) read its `typ` parameter instead, and their value rows (`Modelica Path` column) use the enumeration literals, which match the classes one to one (`Coils.WaterBasedCooling` → `Types.Coil.WaterBasedCooling`). The mogrifier then reads `value` only.

| Short ID | `main` | New |
|---|---|---|
| `OCC` | `Buildings.Templates.ZoneEquipment.Components.Interfaces.ControllerG36VAVBox.have_occSen-ctl.have_occSen` | `Buildings.Templates.ZoneEquipment.{VAVBoxCoolingOnly\|VAVBoxReheat}-ctl.have_occSen` |
| `ENERGY` | `Buildings.Templates.Data.AllSystems.stdEne` | `Buildings.Templates.Data.AllSystems-stdEne` |
| `COOL` | `Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo-coiCoo` | `Buildings.Templates.AirHandlersFans.VAVMultiZone-coiCoo.typ` |
| `OA` | `Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secOut-secOutRel.secOut` | `Buildings.Templates.AirHandlersFans.VAVMultiZone-secOutRel.typSecOut` |

### Golden tests

The documents generated before and after the refactoring are compared by golden tests:

- `client/tests/sequence/golden-payload.test.ts` builds the payloads of 52 projects through the same code path as the UI (display mapping, `getConfigValuesToSave`, `buildSequencePayload`). There is one single-configuration project per template with default values, one per choice of each option displayed by default, and projects combining several templates, several configurations of the same template, and other project settings. Cases are defined by instance paths and values, not by keys.
- `server/scripts/sequence-doc/tests/test_golden.py` generates the document of each payload and compares its text to the expected text.

Both are stored in `server/scripts/sequence-doc/tests/static/golden` and are regenerated with `UPDATE_GOLDEN=1`. The payload format changes the payloads, which are then regenerated. The expected text must not change.

## Prerequisites

Verified on 2026-10-08 with a probe package (quoted components and parameters containing `.`, `-` and `\'`, quoted enumeration literals, a record binding to a quoted record, modifications and expressions referencing quoted identifiers, and a quoted class used as a component type):

- **modelica-json** preserves quoted identifiers verbatim, quotes and escapes included, in declarations, enumeration literals, modifications, expressions and class names.
- **The server parser** preserves them in option paths (`…Template.'c-d'`), modifier keys (`…Template.'c-d'.'a.b'`), enumeration literals and values (`…Types.Valve.'13\'H'`), `enable` expressions (`'with-dash'`), `if` expressions and record bindings (`'rec-1'`).
- **To be implemented:**
  - The parser accepts a quoted class without error (`…Classes.'Q'`). It must reject it.
  - `templates.json` does not record the kind of a class definition: options of class definitions only have `definition: true`. The parser derives it from modelica-json's `class_prefixes` (`elementType` in `_constructElement`), but drops `expandable`. Class definition options get a `kindOfClass` field (class prefixes without `partial`), from which the client sets the `kindOfClass` attribute of values.
  - Six plain `split(".")` sites in the parser apply to element paths, so they would mis-split a component identifier containing `.`. They must use the scanner. The probe showed no symptom: `parser.ts:99` (inherited element lookup), `parser.ts:270`, `parser.ts:506` (`baseType`), `modification.ts:162`, `template.ts:173` (tree list), `schedule.ts:178`. The other seven sites only apply to class names, which are never quoted.

Issues found by the probe, unrelated to quoted identifiers:

- The parser crashes on a class without a description string (`Cannot read properties of undefined (reading 'description_string')`). MLS makes description strings optional; MBL always has them.
- The loader only supports the directory hierarchy mapping (MLS §13.4.1), as documented in `findPackageEntryPoints`: a template defined in a single-file package is not detected. This is consistent with not supporting quoted class identifiers, which can only be stored in a `package.mo`.
- modelica-json reports schema errors for a class without a description string and for a package without elements, while still writing the JSON.

## Out of scope

- Modelica export and the record ⇄ Excel converter (this specification only guarantees that their addresses exist).
- The multi-project UI (creating, switching and removing projects), and generating sequence documents for several projects. The stores and the payload already support them.
- Name lookup in expressions and modifiers (`resolvePaths`, `createPossiblePaths`). It approximates Modelica lookup (MLS §5.3) by trimming the instance path instead of searching the enclosing class scopes.
- Toggle expressions for sections covering several templates configured differently.
- Display of parameters of short class instances (see Known limitations).

## Known limitations

- **Replaceable short classes.** On `main`, short-class choices are written under one key (`…ShortClass-ShortClass`), read under another (`…ShortClass-.FirstComponent`), and the parameters of the selected class are displayed and keyed under the class name (`ShortClass.container`) rather than under the instance. Selecting another class does not change how the instance resolves. No template in `templates.json` uses a replaceable short class in the configuration panel. This refactoring fixes the key (rule 4); the display and resolution of short class instances are tracked separately.
- **Spellings of quoted identifiers.** A source that spells a quoted identifier with and without a redundant escape (`'a\?'` and `'a?'`, `'a\"'` and `'a"'`) is not supported: ctrl-flow keeps identifiers as written, like Dymola and OCT, which reject such a source, although MLS §2.3.1 makes both spellings the same identifier.
