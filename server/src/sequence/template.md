## Dual-Duct VAV Terminal Unit - Snap-Acting Control

<% if (optional) { %>
_Snap-acting control logic is the first choice among the various DD contorl schemes, as it is the most efficient and
does not require DD boxes with mixing sections that have a high pressure drop. It allows use of dual standard
airflow sensors, one at each inlet, with standard pressure independent logic blocks; alternatively, a single discharge
airflow sensors may be used._

_However, snap-acting logic is not ideal for CO<sub>2</sub> control because it can cause the zone to oscillate between cooling
and heating. This occurs when the CO<sub>2</sub> control pushes the Vmin\* up to Vcool-max; at that point, temperature
control is lost, and if the space is overcooled it will be pushe dinto heating, where it will be overheated, then back
again. If CO<sub>2</sub> demand-controlled ventillation is required, the mixing logic described in the next section should be
used._

_This logic assumes no ability to mix hot and cold air to prevent overly low supply air temperatures that may occur
on systems with high outdoor airflows and no preheat coil. So a preheat coil is likely to be required on such systems
if mixed air temperature can fall below 7°C (45°F) or so in winter._

_Note that snap-acting logic can also be problematic for zones with high minimums, because the room itself is acting
as the mixing box._

_Because no cold-duct air is supplied during heating mode, the heating system must include ventilation air either
with direct outdoor air intake or indirectly via transfer air from overventilated spaces on the same system. Refer to
Standard 62.1-2016 and Standard 62.1 User’s Manual._
<% } %>

### See “Generic Thermal Zones” (Section 5.3) for setpoints, loops, control modes, alarms, etc. 

### See “Generic Ventilation Zones” (Section 5.2) for calculation of zone minimum outdoor airflow.

### See Section 3.1.2.7 for zone minimum airflow setpoint Vmin, maximum cooling airflow setpoint Vcoolmax, and the zone maximum heating airflow setpoint Vheat-max.

### Active setpoint shall vary depending on the mode of the Zone Group the zone is a part of (see Table 5.11.4).

#### Table 5.11.4 Setpoint as a Function of Zone Group Mode

| Setpoint | Occupied | Cooldown | Setup | Warmup | Setback | Unoccupied |
|----------|----------|----------|-------|--------|---------|------------|
| Cooling maximum | Vcool-max | Vcool-max | Vcool-max | 0 | 0 | 0 |
| Minimum | Vmin\* | 0 | 0 | 0 | 0 | 0 |
| Heating maximum | Vheat-max | 0 | 0 | Vheat-max | Vheat-max | 0 |

### Control logic is depicted schematically in Figures 5.11.5-1 and 5.11.5-2 and described in the following subsections. setpointOccupied Mode

#### Figure 5.11.5-1 Control logic for snap-acting dual-duct VAV zone (transition from cooling towards heating).

#### Figure 5.11.5-2 Control logic for snap-acting dual-duct VAV zone (transition from heating towards cooling).

<% /*
The engineer must select between ventilation logic options:

If there are airflow sensors at both inlets to the box, use Section 5.11.5.1 and delete Section 5.11.5.2.

If there is a single airflow sensor at the box discharge, use Section 5.11.5.2 and delete Section 5.11.5.1.
*/ %>

<% if (dual_inlet_airflow_sensors) { %>
#### Temperature and Damper Control with Dual Inlet Airflow Sensors

1.  When the Zone State is cooling, the cooling-loop output shall reset the active cold duct airflow setpoint from the minimum endpoint to cooling maximum setpointendpoint. The cold duct damper shall be modulated by a control loop to maintain the measured cooling airflow at the active cold duct airflow setpoint. The hot duct damper shall be closed.
    1.  If cold-deck supply air temperature from the air handler is greater than room temperature, the active cold duct airflow setpoint shall be no higher than the minimum endpoint.
1. When the Zone State is deadband, the active cold duct and hot ductairflow setpoints shall be their last setpoints just before entering deadband. In other words, when going from cooling to deadband, the active cold duct airflow setpoint is equal to the minimum endpoint, and the active hot duct airflow setpoint is zero. When going from heating to deadband, the active hot duct airflow setpoint is equal to the minimum endpoint, and the active cold duct airflow setpoint is zero. This results in a snap-action switch in the damper setpoint as indicated in Figures 5.11.5-1 and 5.11.5-2.

<% if (optional) { %>
_With snap-acting logic, the deadband airflow is maintained by the damper from the last mode, rather than always
using the cold deck, as per the mixing sequences below. This is to avoid instability when transitioning from heating
to deadband._
<% } %>

1.  When the Zone State is heating, the heating-loop output shall reset the active hot duct  airflow setpoint from the minimum endpoint to heating maximum setpointendpoint. The hot duct damper shall be modulated by a control loop to maintain the measured heating airflow at the active hot duct airflow setpoint. The cold duct damper shall be closed.
    1. If hot-deck supply air temperature from the air handler is less than room temperature, the active hot duct airflow setpoint shall be no higher than the minimum endpoint.
<% } else { %>
#### Temperature and Damper Control with a Single Discharge Airflow Sensor

1.  When the Zone States is cooling, the cooling-loop output shall reset the active discharge airflow setpoint from the minimum endpoint to cooling maximum setpointendpoint. The cold duct damper shall be modulated by a control loop to maintain the measured discharge airflow at active discharge airflow setpoint. The hot duct damper shall be closed.
1.  When the Zone State is deadband, the active discharge airflow setpoint shall be the minimum endpoint, maintained by the damper that was operative just before entering deadband. The other damper shall remain closed. In other words, when going from cooling to deadband, the cold duct damper shall maintain the discharge airflow at the minimum setpointendpoint, and the hot duct damper shall be closed. When going from heating to deadband, the hot duct damper shall maintain the discharge airflow at the zone minimum setpointendpoint, and the cold duct damper shall be closed. This results in a snap-action switch in the damper setpoint as indicated in Figures 5.11.5-1 and 5.11.5-2.
1.  When the Zone State is heating, the heating-loop output shall reset the active discharge airflow setpoint from the minimum endpoint to heating maximum setpointendpoint. The hot duct damper shall be modulated by a control loop to maintain the measured discharge airflow at the active discharge airflow setpoint. The cooling damper shall be closed.
<% } %>

<% /*
This concludes the section where the airflow sensor configuration is selected.

When the sequences are complete, only one of Section 5.11.5.1 and Section 5.11.5.2 should remain. The other section should be deleted, along with these flag notes.
*/ %>

#### Overriding Sections 5.11.5.1 and 5.11.5.2 Logic (to Avoid Backflow from One Duct to the Other)

1.  If heating air handler is not proven on, the heating damper shall be closed.
1.  If cooling air handler is not proven on, the cooling damper shall be closed.