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

Annotations are evaluted into either true or false, showing or hiding the specific section based. This expression checks: does `SP` equal the type `RELIEFDMPR`. The meaning of `buiPreCon` and `ReliefFan` is mapped to a specific modelica template location in the mapping csv.

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
Modelica-Parameter: ctrl-flow's selection path
Modelica-Path: the value of that selection

Going back to the example annotation:

```
[EQUALS BSP RELIEFDMPR]
```

`BSP` maps to: `Buildings.Templates.AirHandlersFans.Components.Controls.Interfaces.PartialVAVMultizone.buiPreCon-ctl.buiPreCon`

`RELIEFDMPR` maps to: `Buildings.Controls.OBC.ASHRAE.G36.Types.BuildingPressureControlTypes.ReliefFan`

These long paths can then be used to resolve the annotation in the script.

TODO: add info about each column

## Information Boxes and Styles

Information boxes are hidden by applying either of these styles (exactly as listed):

- `Info. box`
- `InfoboxList`

## Updating the Source Document and Mappings File

In `server/scripts/sequence-doc/src/version`, check the creation date of the source document and mappings file in the `current` directory.

- Create a folder in `version` matching the format of previous sequence document versions: `<YYYY-MM-DD> G36 Decision`, e.g. `2022-12-15 G36 Decisions`.
- Move both the csv and docx from the `current` folder into the dated folder just created
- Move the updated source document and mappings csv into current, matching the nameing: `Guideline36-2021 (mappings).csv` and `Guideline36-2021 (sequence selection source).docx`

Always update both the mappings and source file.
