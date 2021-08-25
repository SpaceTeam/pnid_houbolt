# Interactive PnID Visualizer

Allows to parse a KiCad schematic file (.sch) to generate a .html webpage. Via embedded JavaScript it's possible to edit values of elements on the PnID via state update messages. Each (named = updatabale) element can also be clicked to open a popup to control the value directly from the PnID (Proper click hitbox only works on Chromium based browsers currenty).
The behaviour of the PnID is controlled in parts by a JSON config file (currently hardcoded in changeValues.js) in the elements' respective "eval" block.
Styling is (obviously) controlled by CSS (in `/client/css`)

# Usage

For development the npm package `nodemon` is helpful as it automatically restarts the web server when there are changes to the code.

## Start Webserver

`node server.js [port]`

Port is optional, but nice for permission reasons as with default port (80) sudo is needed on Linux

Example:

`node server.js port=8080`

If run with nodemon, simply replace "node" with "nodemon"

## Visit PnID page

In a web browser of your choice, open `localhost:8080`. The PnID is currently tested for Chromium based browsers and Firefox, though some functionality may be slightly different depending on which browser is used.

## Debugging / Development

For easy debugging of the code test data can be generated and displayed, this can be done by running either `runTests()` or `runRandom()` in your browser's console. The former is a set of manually entered test data that is displayed sequentially, the latter generates random data *for every element in the PnID with a value reference*. This means that `runRandom()` may generate data for elements that would in normal use not get any values like the nitrogen bottles.

# Documentation

## Nomenclature

* State (also called "state update"): A name (key) / value pair, where the name is one variable (and usually corresponds to one entity) in the PnID and its respective current value. State updates are sent/received as a list (array) of several individual states. Example state: `{"name": "fuel_pressurize_solenoid", "value": "23.7"}`
* (PnID) Element: One entity in the PnID, eg: The fuel tank, a servo valve, ...
* Behaviour: The behaviour of an element is the way the element reacts to state updates. This includes the way it is coloured, how the values are displayed and so on. The behaviour is defined either in the #default-config or the #custom-config.
* raw value: The value actually sent in a state update. No behaviour code has interpreted or altered this yet.
* value output (also called output value, value, actual displayed value, ...): The value that has been generated by behaviour code from the raw value. May contain units or be completely different, like raw value "67.3" being interpreted as value output "Open" for a solenoid valve, as "Throttled (67)" for a servo valve or as "67.3kg" for a tank.

Identifiers of PnID elements:
* Reference: A (unique) reference number (ID) generated by KiCad, eg: `S3`
* Type: The type a certain PnID element is. For example a PnID element could be a Valve actuated by a Solenoid which would have the type `PnID-Valve_Solenoid`
* Value Reference (also called name, value field or similar): The de-facto ID of a PnID element. In contrast to IDs usually **this does not have to be a unique value**, it only specifies which variable (state name) this PnID element "listens" to. Eg: Assume an element has the value reference `fuel_pressurize_solenoid`. If a state update is received containing `{"name": "fuel_pressurize_solenoid", "value": "23.7"}` this element will be updated with the new value (23.7). State updates with other names are not applied to this one (they can be linked via the `crossUpdate` functionality of eval blocks, see #config for more info). If several elements have the same value reference they *all* will be updated with the same value. This is for example in use to link pressure sensors to their respective pipes, but it also means that for true unique identification other fields have to be used together with the value reference.

## kicad-schematic-parser

Convert a KiCad schematic (.sch) file to a JavaScript data structure.
Uses TXV_Teststand_PnID (branch html_pnid) as base.

Usage example: `node kicad-schematic-parser.js ../path_to_sch/pnid_schematic_name.sch ../path_to_symbol_lib/pnid_lib_name.lib`

### Notes

* The parser generates a list of svg `<g>` elements with a bunch of classes to identify and style it. These classes need to be in this exact order (Reference `S3`, Type `PnID-Valve_Solenoid`, (identifying) name `fuel_pressurize_solenoid`, `comp` or `wire`), otherwise popups won't work as expected
* When flipping elements in KiCad around the vertical axis some weird stuff happens with the text alignment - aligning text to the left and then flipping it *also flips this alignment making it justified to the right in the actual PnID*. This means, that in KiCad some references and value references may look "the wrong way around" but are actually correct once exported with the parser. Keep this in mind while designing the PnID.

## Config

*ATTENTION: THIS IS CURRENTLY HARDCODED IN `changeValues.json` FOR EASIER DEVELOPMENT!*

### Overview

Config files are parsed top to bottom, so if several behaviour blocks apply to one element the effects of the last element will override the previous ones. Similarly, the default config is parsed before the custom config, so anything that happens in the custom config will override (and/or extend) default behaviour.
For example if there is a behaviour in the default config setting the colour of an element based on the received value and another behaviour in the custom config changing the formatting of the value output, both outputs will be visible. If however the custom behaviour changes the formatting of the value output AND sets another colour, it will overwrite the colour set by the default config.

### Default Config

The default config implements behaviour (specified in "eval" blocks as JS) and popup definitions (specified in the "popup" blocks as an array of JSON blocks). A top level entry in the default config should be named after a *type* and it will apply to all elements of this type.

Example:
```json
"PnID-Valve_Solenoid": {
  "eval": "if (inVars['value'] > 50) { outVars['color']='open'; outVars['value']='Open' } else { outVars['color']='closed'; outVars['value']='Closed' }",
	"popup": [
    {
      "type": "display",
      "variable": "value",
      "style": "text"
    },
    {
      "type": "checkbox",
      "variable": "value",
      "low": "Closed",
      "high": "Open"
    }
  ]
}
```

The subheadings #eval-behaviour-blocks and #popup-definitions contain more info for their respective configs

### Custom Config

The custom config is able to override the *behaviour* parts of the default config, but *cannot implement individual popup definitions*. In here a top level entry can be named to anything arbitrary as its only used for human readability and structuring. In this top level entry a list of `states` which should adopt this custom behaviour is specified. The states are identified by using the *value reference*.

*TODO: Allow custom config to override popup definitions (not extend, completely replace from default ones). This is needed for the ability to include other variables into a popup (eg for computed states) because otherwise all elements of this type will have the same computed states which makes no sense*

Example:
```json
"temperature_oxidizer_tank": {
  "states": [
    "ox_top_tank_temp",
    "ox_mid_top_tank_temp",
    "ox_mid_bottom_tank_temp",
    "ox_bottom_tank_temp"
  ],
  "eval": "if (inVars['value'] > thresholds['oxTemp']['high']) { outVars['color']='high' } else if (inVars['value'] > thresholds['oxTemp']['low']) { outVars['color']='neutral' } else { outVars['color']='low' }"
},
```

### Eval behaviour blocks

The eval blocks contain behaviours for elements. Which ones they apply to depends on where they are used (in #default-config or #custom-config and which identifiers it is used alongside). Eval blocks are as the name suggests blocks of JS code that will be run using the `eval()` function. Yes, this can be a huge security risk, no it's not an issue as this is only run locally and the content of the eval blocks cannot be changed by a user (nevermind an outside user) during runtime.

For ease of use there is a list of variables intended as inputs and outputs to the eval blocks which cover the most important use cases for them. Technically if a necessary input or output does not exist it can be added as it is fully featured JS, but it is preferable to extend the features of the inputs and outputs to use simpler behaviour code in the configs.

Input variables (addressible via `inVars[<variable name>]`):
* value - contains the (new) value of the element that is being updated
* unit - contains the unit (usually appended to the value) of the element that is being updated

Output variables (addresible via `outVars[<variable name>]`), only have an effect if set by the eval block:
* color - tries to set the color of the *parent* element to the value of this variable. Which colors are valid depends on the type of element (see pnid.css "data-pnid-" declarations for valid values)
* value - overrides the value field with custom content
* crossUpdate - If set, passes content to updatePNID(stateList) to update another component (eg: a wire group) in the PnID. This allows updating components that would otherwise be unaffected by the current update message (EXPERIMENTAL!)

Additionally, for a more straightforward and adaptable use there is a `thresholds` array containing key values of interest, like pressure thresholds for the tanks, accessible via names, so the behaviour code is more easily readable (instead of a random number it's `thresholds['oxPressure']['low']`) and more centralized (changes to the thresholds only need to be changed in one place, not in every single behaviour block that uses these values).
For contents of the thresholds array, check the file [thresholds.json](client/config/thresholds.json) **(ATTENTION: RIGHT NOW THIS FILE IS IGNORED AND INSTEAD USED HARDCODED IN `changeValues.js` FOR EASE OF DEVELOPMENT)**

### Popup definitions

A popup definition is a list (array) of "building blocks" that a popup can be made of. Each building block serves a self contained UI purpose, meaning there is no direct interaction between two blocks.
The individual building blocks are positioned one after another vertically with the first one being below the popup header containing the drag and drop move button, the title (which is the value reference of this element) and the close button for the popup. When a state update is received that updates a value from the popup, the new values are updated on all building blocks of the popup.

The building blocks are defined as a list of JSON key value pairs, where the "type" value defines which other keys to expect
Possible types:
* display: Used to simply display a value without any option for interaction.
* checkbox: Display a checkbox.
* slider: Display a slider.
* textEntry: A free-form text entry. NOT IMPLEMENTED YET

*TODO: Consider changing "checkbox" to "input" and adding a "style" value defining which kind of input it should be*

All types use "variable" as a "sub-key" which defines which variable to display/affect. The "default" should be "value" which is translated to the value reference of the element that the popup is opened at. Should allow for customizing to show several different values in one popup such as computed values. WIP: Different variables don't actually work yet, has to be implemented properly first (maybe after the popup refactor. Or consider if it's even needed because right now there's only fringe usecases at best).

Sub-keys for type "display":
* style: Can be either "text" which simply displays the value as a text output (basically a copy of the value output in the PnID itself) or "graph" (NOT IMPLEMENTED YET) which displays a graph of the value over time.

Sub-keys for type "checkbox":
* low: Which value the "low" value is. Eg for a solenoid valve the "low" value could be "Closed". This is the actual value displayed by the UI in the PnID, not the raw value sent via state updates.
* high: Similar to low, but for the high value

*TODO: Consider adding something like "highTreshold" which would check for the actual raw value instead of the interpreted/formatted value and would be a threshold like eg: 0.5 where x > 0.5 is true and x < 0.5 is false. If this is needed it may need an additional value for defining "direction" so eg x > 0.5 would be false instead of true.*

Sub-keys for type "slider":
* low: Minimum value of the slider
* high: Maximum value of the slider

## pnid.css

When creating new states an element can have such as

```css
[data-pnid-valve_pneumatic=open] {
    stroke: var(--open);
}
```

it is *absolutely necessary* that the state begins with "data-pnid-" for the code in `changeValues.js` to recognize it.

