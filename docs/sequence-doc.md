# Sequence Document

The sequence document is a dynamically generated document, taking in the values of a project from ctrl-flow (the payload, see the "Payload" section of [selection-keys.md](selection-keys.md)) and generating a docx. The endpoint rejects a payload with an unsupported `schemaVersion` or without exactly one project.

This document describes the process of updating the sequence document and how to use annotations.

## Annotations

A typical annotation looks as follows:

```
[EQUALS BSP RELIEFDMPR]
```

`EQUALS`: the operator type

`BSP`: short code defined in the mappings CSV

`RELIEFDMPR`: short code defined in the mappings CSV

Annotations are evaluted into either true or false, showing or hiding the specific section based. This expression checks: does `BSP` equal the type `RELIEFDMPR`. The meaning of `buiPreCon` and `ReliefFan` is mapped to a specific modelica template location in the mapping csv.

The annotation is enclosed in square brackets `[]`

The annotation text and ONLY the annotation text (which includes the brackets) has a style applied: `Toggle`. This style is used as an identifier by the sequence document generation script to find annotations.

An annotation is a continuous stretch of text with the `Toggle` style within one paragraph: text with another style ends it. A Word comment anchored on an annotation, e.g. on a short ID, does not split it. A section removed by an annotation is removed with the comments anchored in it.

### Example Annotations:

        + `[YES CO2]` – Keep this section if a configuration has a CO2 sensor. Otherwise remove.
        + `[NO CO2]` – Keep this section if a configuration has no CO2 sensor. Otherwise remove.
        + `[EQUALS BSP RELIEFDMPR]` – Keep this section if the type of building pressure control system of a configuration is an actuated relief damper, with relief fan(s). Otherwise remove.
        + `[NOT_EQUALS BSP RELIEFDMPR]` - Keep this section if the type of building pressure control system of a configuration is *not* an actuated relief damper, with relief fans(s). Otherwise remove.
        + `[ANY BSP RETURNTRACK]` – Keep this section if the type of building pressure control system of a configuration is a return fan, tracking measured supply and return airflow or a return fan, tracking calculated supply and return airflow. Otherwise remove.
        + `[AND [any toggle] [any toggle]]` - Keep this section if both nested toggles are true on the same configuration. The nested toggles can be any of these toggles including AND, OR or NONE. Otherwise remove.
        + `[OR [any toggle] [any toggle]]` - Keep this section if one of the nested toggles is true on a configuration. The nested toggles can be any of these toggles including AND, OR or NONE. Otherwise remove.
        + `[NONE [any toggle]]` - Keep this section if the nested toggle is true on no configuration. Otherwise remove.
        + `[DELETE]` - Remove this section.

Table annotations

        Example table toggles:
        + `[TABLE YES CO2]` - Keep the whole table if a CO2 sensor is present. Otherwise remove.
        + `[ROW YES CO2]` or `[ROW [YES CO2]]` - Keep this row if a CO2 sensor is present. Otherwise remove.
        + `[COLUMN YES CO2]` - Keep this column if a CO2 sensor is present. Otherwise remove.
        + `[COLUMN AND [any toggle] [any toggle]]` - Keep this column if both nested toggles would keep the column. Otherwise remove.

### Evaluation

An annotation is evaluated on each configuration of the project, with the values of the configuration, the project settings, and for a system type, the template of the configuration if it has that system type. **A section is kept if its annotation is true on at least one configuration.** A project without configurations is evaluated on the project settings alone.

- Each key has one value on a configuration, so `NO` is the negation of `YES`, and `NOT_EQUALS` the negation of `EQUALS`.
- A key that a configuration does not have satisfies no annotation on it, including `NO` and `NOT_EQUALS`. Otherwise an AHU, which has no `have_CO2Sen`, would satisfy `[NO CO2]`. A system type that the project doesn't use has no keys: `YES`, `NO`, `EQUALS`, `NOT_EQUALS` and `ANY` are then false. In `[OR [YES CO2_PFBCV] [YES CO2_SFBCV]]`, a missing system type therefore doesn't delete the section.
- `AND` is true on a configuration if both operands are true on that configuration: two configurations that each satisfy one operand do not keep the section. For the same reason, an `AND` cannot combine keys of two system types, which no configuration has: `tests/test_section_scope.py` rejects it. A `NONE` operand is allowed, as it has the same value on all configurations.
- An invalid annotation or an unknown short ID is an error, and no document is generated. Otherwise a misspelled `NONE` operand would be false, and keep the section.

**`NONE`.** `[NO CO2]` and `[NONE [YES CO2]]` differ when the configurations differ:

| Zones | `[NO CO2]` | `[NONE [YES CO2]]` |
|---|---|---|
| All with a CO2 sensor | removed | removed |
| Some with a CO2 sensor | kept | removed |
| None with a CO2 sensor | kept | kept |
| No zone | removed | kept |

`[NO CO2]` is for a section that applies to each zone without a sensor. `NONE` is for a section that one configuration is enough to rule out. This is the case of a section of a system that depends on the systems it serves: `[NONE [YES CO2]]` for the setpoint of an AHU that no zone resets, and `[NONE [ANY VAV DDDIS]]` for a totalization of the airflow of the boxes that needs all boxes to measure it. `[NONE [AND [YES A] [YES B]]]` is true if no configuration satisfies both operands.

**Enclosing headings.** A section is removed with its heading, and otherwise only depends on its own annotation. A heading and a section it encloses can therefore be satisfied by different configurations. If they must be the same one, the annotation of the section states it with `AND`: under `[OR [OR [YES WIN] [YES OCC]] [YES CO2]]`, `[AND [OR [YES OCC] [YES CO2]] [NO WIN]]` needs a zone with a sensor and no window switch, whereas `[NO WIN]` would be satisfied by another zone than the one that keeps the heading.

### Scope of an Annotation

The section removed by an annotation depends on the style of the paragraph that starts with the annotation:

- Heading (`Heading N`): the heading and everything below it, up to the next heading of the same or a higher level.
- Information box (`Info. box`, `InfoboxList`, `InfoTableTitle`): the paragraph only.
- Any other style: the paragraph only, and any table that directly follows it.

### Heading Numbering

**Headings SHALL be numbered by the automatic numbering of their style, never by typed numbers.** The script removes sections but does not edit the text of the headings that remain: Word computes the numbers of the headings when it opens the generated document, so the numbering stays continuous after a removed section. A typed number such as `3.2.5.4.2 Parallel Fan Start/Stop` is kept as is, which leaves a gap when `3.2.5.4.1` is removed.

- Each `Heading N` style used in the document references a multilevel list (`w:numPr` in the style, with the list level of the heading). Word does this with Define New Multilevel List: link each level to its heading style.
- A document that is an excerpt starts its numbering where the excerpt starts. For instance, the headings of `DOD_20260828` start at section 3.2.3: the level of `Heading 3` has the number format `3.2.%3` and starts at 3, the level of `Heading 4` the format `3.2.%3.%4`, and so on.
- The heading text starts with the annotation, if any, then the title: `[EQUALS VAV RH] VAV Box with Reheat`.
- Do not skip a heading level: a `Heading 5` directly under a `Heading 3` gets a number with a level that has no heading, e.g. `3.2.5.1.1` without `3.2.5.1`.

The numbers are not in the text of the paragraphs: the expected texts of `test_golden.py` and other plain-text conversions show headings without numbers.

### Units

`[UNITS [<SI>] [<IP>]]` is replaced by `<SI>` or `<IP>` depending on the unit system of the project (`UNITS`), e.g. `[UNITS [12 Pa] [0.05 in.]]`. SI comes first. The whole annotation, including both alternatives, has the `Toggle` style and is within one paragraph. The replacement takes the format of the first run of the annotation, so formatting within the alternatives is lost.

The script only reads text: an alternative that is an equation, a picture or any other content than text cannot be in a `UNITS` annotation. Use one paragraph for each unit system instead, SI first, and do not apply the `Toggle` style to the content:

```
[EQUALS UNITS SI]<SI equation or picture>
[EQUALS UNITS IP]<IP equation or picture>
```

## Mappings

A mappings file is used to map from 'short codes' to exact template locations.

Short ID: Short name used in annotations
Modelica Parameter: the selection key of the value in ctrl-flow, or a key pattern
Modelica Path: the value of that selection

The annotations read the `value` of an element only. The class of a replaceable element is a redeclaration, not a value: it is read through the `typ` parameter of the class, whose enumeration literals match the classes one to one. For instance, `COOL` maps to `Buildings.Templates.AirHandlersFans.VAVMultiZone-coiCoo.typ`, and `CHW` to `Buildings.Templates.Components.Types.Coil.WaterBasedCooling`.

Going back to the example annotation:

```
[EQUALS BSP RELIEFDMPR]
```

`BSP` maps to: `Buildings.Templates.AirHandlersFans.VAVMultiZone-ctl.buiPreCon`

`RELIEFDMPR` maps to: `Buildings.Controls.OBC.ASHRAE.G36.Types.PressureControl.ReliefFan`

These long paths can then be used to resolve the annotation in the script.

A key is `<template>-<elementPath>`, see [selection-keys.md](selection-keys.md). A key pattern lists several templates of one system type, e.g. `CO2` maps to `Buildings.Templates.ZoneEquipment.{VAVBoxCoolingOnly|VAVBoxReheat}-ctl.have_CO2Sen`: on a configuration of either template, the annotation reads `ctl.have_CO2Sen` of that template (see the "Mappings" section of [selection-keys.md](selection-keys.md)).

### Sections of System Types

A short ID maps to one key or key pattern, wherever it is used in the source document. Which one to use depends on the section:

- A section of a single system type (toggled by a system type, e.g. `[EQUALS VAV RH]`) uses short IDs of the template of that system type, e.g. `TERM_HT_RH` → `Buildings.Templates.ZoneEquipment.VAVBoxReheat-coiHea.typ`. Otherwise the values of another template would keep or delete the section. A section toggled by several templates of a system type, e.g. `[ANY VAV PFBCV SFBCV]`, combines short IDs of these templates, e.g. `[OR [YES NC_PFBCV] [YES NC_SFBCV]]`. `tests/test_section_scope.py` checks that such sections read no key of another template of the same system type, and that the sections of the templates listed for the default version are found. Keys of other system types are not restricted: e.g. a section of the AHU reads the CO2 sensors of all zones.
- A section shared by several system types uses a key pattern, read on each configuration of its templates (e.g. `CO2`: kept if any zone has a CO2 sensor), or combines short IDs of each template, e.g. `[OR [YES CO2_PFBCV] [YES CO2_SFBCV]]`.

`AND` and `OR` take exactly two operands, each of which can be a nested toggle.

A section of a system type is kept if any configuration of that type needs it (see Evaluation).

TODO: add info about each column

## Information Boxes and Styles

Information boxes are hidden by applying either of these styles (exactly as listed):

- `Info. box`
- `InfoboxList`

## Updating the Source Document and Mappings File

The source document and the mappings file are in `server/scripts/sequence-doc/src/version/Current G36 Decisions`. Only the current version is kept: earlier versions are in the git history. They were removed because their mappings use selection keys that ctrl-flow no longer produces.

- Replace both files, keeping their names: `Guideline 36-2021 (mappings).csv` and `Guideline 36-2021 (sequence selection source).docx`.
- Write the `Modelica Parameter` column with selection keys or key patterns of elements that hold a value (see Mappings).
- Run the tests:
  - `client/tests/sequence/mappings.test.ts` checks that every key of the mappings is the key under which ctrl-flow stores the value of the element, and that the element is not replaceable: otherwise the key has no value in the payload, and the toggle treats the value as missing.
  - `server/scripts/sequence-doc/tests/test_section_scope.py` checks that every toggle has a valid format and uses short IDs of the mappings, that an `AND` or a key pattern reads one system type (see Evaluation), that every heading is numbered by a list (see Heading Numbering), and that the sections of system types read the keys of their templates only (see Sections of System Types). Add the templates of a new version to `SECTIONS`. Typed heading numbers cannot be told apart from a title that starts with a number, e.g. `1.5 minutes`: check them in Word.
  - `server/scripts/sequence-doc/tests/test_golden.py` compares the generated documents to the expected texts. If the changes of the document are intended, regenerate the expected texts with `UPDATE_GOLDEN=1` and review their diff.

Always update both the mappings and source file.
