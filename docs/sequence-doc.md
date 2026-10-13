# Sequence Document

The sequence document is a dynamically generated document, taking in selections from ctrl-flow and generating a docx.

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

### Example Annotations:

        + `[YES CO2]` – Keep this section if a CO2 sensor is present. Otherwise remove.
        + `[NO CO2]` – Keep this section if a CO2 sensor is not present. Otherwise remove.
        + `[EQUALS BSP RELIEFDMPR]` – Keep this section if the type of building pressure control system is an actuated relief damper, with relief fan(s). Otherwise remove.
        + `[NOT_EQUALS BSP RELIEFDMPR]` - Keep this section if the type of building pressure control system is *not* an actuated relief damper, with relief fans(s). Otherwise remove.
        + `[ANY BSP RETURNTRACK]` – Keep this section if the type of building pressure control system is a return fan, tracking measured supply and return airflow or a return fan, tracking calculated supply and return airflow. Otherwise remove.
        + `[AND [any toggle] [any toggle]]` - Keep this section if both nested toggles would keep the section. The nested toggles can be any of these toggles including AND or OR.  Otherwise remove.
        + `[OR [any toggle] [any toggle]]` - Keep this section if one of the nested toggles would keep the section. The nested toggles can be any of these toggles including AND or OR.  Otherwise remove.
        + `[DELETE]` - Remove this section.

Table annotations

        Example table toggles:
        + `[TABLE YES CO2]` - Keep the whole table if a CO2 sensor is present. Otherwise remove.
        + `[ROW YES CO2]` - Keep this row if a CO2 sensor is present. Otherwise remove.
        + `[COLUMN YES CO2]` - Keep this column if a CO2 sensor is present. Otherwise remove.
        + `[COLUMN AND [any toggle] [any toggle]]` - Keep this column if both nested toggles would keep the column. Otherwise remove.

## Mappings

A mappings file is used to map from 'short codes' to exact template locations.

Short ID: Short name used in annotations
Modelica Parameter: the selection key of the value in ctrl-flow, or a key pattern
Modelica Path: the value of that selection

Going back to the example annotation:

```
[EQUALS BSP RELIEFDMPR]
```

`BSP` maps to: `Buildings.Templates.AirHandlersFans.VAVMultiZone-ctl.buiPreCon`

`RELIEFDMPR` maps to: `Buildings.Controls.OBC.ASHRAE.G36.Types.PressureControl.ReliefFan`

These long paths can then be used to resolve the annotation in the script.

A key is `<template>-<elementPath>`, see [selection-keys.md](selection-keys.md). A key pattern lists several templates, e.g. `CO2` maps to `Buildings.Templates.ZoneEquipment.{VAVBoxCoolingOnly|VAVBoxReheat}-ctl.have_CO2Sen`: the annotation is evaluated against the values of `ctl.have_CO2Sen` in all configurations of both templates (see the "Mappings" section of [selection-keys.md](selection-keys.md)).

TODO: add info about each column

## Information Boxes and Styles

Information boxes are hidden by applying either of these styles (exactly as listed):

- `Info. box`
- `InfoboxList`

## Updating the Source Document and Mappings File

The source document and the mappings file are in `server/scripts/sequence-doc/src/version/Current G36 Decisions`. Only the current version is kept: earlier versions are in the git history. They were removed because their mappings use selection keys that ctrl-flow no longer produces.

- Replace both files, keeping their names: `Guideline 36-2021 (mappings).csv` and `Guideline 36-2021 (sequence selection source).docx`.
- Write the `Modelica Parameter` column with selection keys or key patterns (see Mappings).
- Run the tests:
  - `client/tests/sequence/mappings.test.ts` checks that every key of the mappings resolves in its template.
  - `server/scripts/sequence-doc/tests/test_golden.py` compares the generated documents to the expected texts. If the changes of the document are intended, regenerate the expected texts with `UPDATE_GOLDEN=1` and review their diff.

Always update both the mappings and source file.
