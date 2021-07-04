# Interactive PnID Visualizer

Allows to parse a KiCad schematic file (.sch) to generate a .html webpage. Via embedded JavaScript it's possible to edit values of elements on the PnID via state update messages.
The behavior of the PnID is controlled in parts by a JSON config file (currently hardcoded in changeValues.js) in the elements' respective "eval" block.
Styling is (obviously) controlled by a CSS (pnid.css)

# Documentation

## kicad-schematic-parser

Convert a KiCad schematic (.sch) file to a JavaScript data structure.

## config.json

The config is parsed top to bottom, so any default behavior should be as high up as possible while any custom behavior for individual elements should go below the default ones.

### Available variables in "eval"

Input variables (addressible via `inVars[<variable name>]`):
* value - contains the (new) value of the element that is being updated

Output variables (addresible via `outVars[<variable name>]`), only have an effect if set by the eval block:
* color - tries to set the color of the *parent* element to the value of this variable. Which colors are valid depends on the type of element (see pnid.css "data-pnid-" declarations for valid values)
* value - overrides the value field with custom content

### Example

```json
{
  "solenoid": {
    "states": [
      "purge_solenoid",
      "fuel_pressurize_solenoid",
      "ox_pressurize_solenoid",
      "fuel_depressurize_solenoid"
    ],
    "eval": "inVars['val'] > 10 ? outVars['color']='open' : outVars['color']='closed'"
  },
  "customSolenoid": {
    "states": [
      "fuel_pressurize_solenoid"
    ],
    "eval": "if (inVars['val'] > 10) { outVars['color']='undefined'; outVars['value']='open'+inVars['value'] } else { outVars['color']='undefined'; outVars['value']='open'+inVars['value']}"
  }
}
```

Here the "solenoid" group contains a list of states (names) that belong to this group. If a state update message is sent for any of these elements the code in the "eval" block will be executed. 

## pnid.css

When creating new states an element can have such as

```css
[data-pnid-valve_pneumatic=open] {
    stroke: var(--open);
}
```

it is *absolutely necessary* that the state begins with "data-pnid-" for the code in changeValues.js to recognize it.