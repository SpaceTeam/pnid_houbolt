# Interactive PnID Visualizer

Allows to parse a KiCad schematic file (.sch) to generate a .html webpage. Via embedded JavaScript it's possible to edit values of elements on the PnID via state update messages. Each (named = updateable) element can also be clicked to open a popup to control the value directly from the PnID (Proper click hitbox only works on Chromium based browsers currenty).

The PnID visualizer was made to be as configurable and widely usable as possible, but as it has so far only been used for a certain kind of projects (our internal rocket projects) it necessarily evolved to fit our use cases better. Some hardcoded behaviours and logic still remain and certain config options are heavily influenced by what we needed from it at the time, meaning some options are available only for some elements and elements overall may not have a fully consistent behaviour in what they display how.

As of right now we use KiCad5 schematics and library files, as KiCad6 has changed those formats significantly and we haven't finished porting the converter over to the new version.

The behaviour of the PnID is controlled in parts by a JSON config file in the elements' respective "eval" block.
Styling is controlled by CSS (in `/client/css`)

# Security Disclaimer

A lot of the core functionality depends on JavaScript's eval() function meaning that *this is not a "safe" tool* in an IT security sense. We have chosen this for the following reasons:
- All inputs (= files) that can set arbitrary JS strings to be executed are locally on the server and there can be no online user input that drives these values.
- Not using eval meant that we would need to put significant time into developing our own "script language" that allows us to build in as many features and as much flexibility as we had access to when using eval. As we had more than enough to do with the already very large scope of the project (completely self developing and building an extremely lightweight bi-liquid rocket, its ground support equipment and its accompanying mission control software in a modular and configurable fashion) we simply didn't have the time and resources to commit to this.
- Our entire mission control infrastructure runs on a local network that doesn't need to be connected to the internet to function.

All of this means that while using eval() is still a large security risk, we felt like it was manageable risk as realistically the only way someone could exploit this, they would need to have direct access to our server from within our network, at which point they already have access to our server so why bother with injecting malicious JS into config files instead of just getting whatever they want directly.
That said, there are almost definitely attack vectors we didn't think about (we're students and rocketry hobbyists, not IT security researchers) and ways for bad actors to exploit this. We are fine with these risks in our current situation with our current setup, but this is something that you - the potential user - will have to **carefully** consider for yourself and your situation.

# Usage

For development the npm package `nodemon` is helpful as it automatically restarts the web server when there are changes to the code.

## Start Webserver

**ATTENTION! Running the pnid standalone is currently broken as the server.js is not set up to read configs on custom paths and the config has been moved to an external repository. Right now PnID can only be run embedded in ECUI, see instructions there for setup.**

`node server.js [port]`

Port is optional, but nice for permission reasons as with default port (80) sudo is needed on Linux

Example:

`node server.js port=8080`

If run with nodemon, simply replace "node" with "nodemon"

## Visit PnID page

In a web browser of your choice, open `localhost:8080` (or whatever other port you specified). The PnID is currently tested for Chromium based browsers and Firefox, though some functionality may be slightly different depending on which browser is used.

## Debugging / Development

For easy debugging of the code, test data can be generated and displayed, this can be done by running either `runTests()` or `runRandom()` in your browser's console. The former is a set of manually entered test data that is displayed sequentially, the latter generates random data *for every element in the PnID with a value reference*. This means that `runRandom()` may generate data for elements that would in normal use not get any values (like the nitrogen bottles).

## Developer Documentation

Code documentation is done with JSDoc 3.6.7, the docs can be compiled by either running

`jsdoc -c docs/jsdoc_conf.json`

or simply running

`bash create_docs.sh`

They should be saved to `docs/html/`, the `html/` folder will be created automatically by JSDoc.

# User Documentation

## Nomenclature

* State (also called "state update"): A name (key) / value pair, where the name is one variable (and usually corresponds to one entity) in the PnID and its respective current value. State updates are sent/received as a list (array) of several individual states. Example state: `{"name": "fuel_pressurize_solenoid", "value": "23.7"}`
* (PnID) Element: One entity in the PnID, eg: The fuel tank, a servo valve, ...
* Behaviour: The behaviour of an element is the way the element reacts to state updates. This includes the way it is coloured, how the values are displayed and so on. The behaviour is defined either in the [default config](#default-config) or the [custom config](#custom-config).
* Raw Value: The value actually sent in a state update. No behaviour code has interpreted or altered this yet.
* Value Output (also called output value, value, actual displayed value, ...): The value that has been generated by behaviour code from the raw value. May contain units or be completely different, like raw value "67.3" being interpreted as value output "Open" for a solenoid valve, as "Throttled (67)" for a servo valve or as "67.3kg" for a tank.

Identifiers of PnID elements:
* Reference: A (unique) reference number (ID) generated by KiCad, eg: `S3`
* Type: The type a certain PnID element is. For example a PnID element could be a Valve actuated by a Solenoid which would have the type `PnID-Valve_Solenoid`
* Value Reference (also called name, value field or similar): The de-facto ID of a PnID element. In contrast to IDs usually **this does not have to be a unique value**, it only specifies which variable (state name) this PnID element "listens" to. Eg: Assume an element has the value reference `fuel_pressurize_solenoid`. If a state update is received containing `{"name": "fuel_pressurize_solenoid", "value": "23.7"}` this element will be updated with the new value (23.7). State updates with other names are not applied to this one (they can be linked via the `link()` or `crossUpdate` functionality of eval blocks, see [eval behaviour blocks](#eval-behaviour-blocks) for more info). If several elements have the same value reference they *all* will be updated with the same value. This is for example in use to link pressure sensors to their respective pipes, but it also means that for true unique identification other fields have to be used together with the value reference.
* Action Reference: A reference that can bundle the popups for several elements into one and sends its reference to the LLServer. This is used for example for `fuel_press_depress` where the press solenoid and depress solenoid both have the action reference `gui:fuel_press_depress` and open the same popup that sends a state with the action reference as name to the LLServer which in turn updates the corresponding elements as needed.

## kicad-schematic-parser

Convert a KiCad schematic (.sch) file to a JavaScript data structure.
Uses TXV_Teststand_PnID (branch html_pnid) as base.

Usage example: `node kicad-schematic-parser.js ../path_to_sch/pnid_schematic_name.sch ../path_to_symbol_lib/pnid_lib_name.lib`

### Notes

* The parser generates a list of svg `<g>` elements with a bunch of classes to identify and style it. These classes need to be in this exact order (Reference `S3`, Type `PnID-Valve_Solenoid`, value reference `fuel_pressurize_solenoid`, `comp` or `wire`), otherwise various parts of the pnid won't work as expected (especially popups).
* When flipping elements in KiCad around the vertical axis some weird stuff happens with the text alignment - aligning text to the left and then flipping it *also flips this alignment* making it justified to the right in the actual PnID. This means that in KiCad some references and value references may look "the wrong way around", but are actually correct once exported with the parser. Keep this in mind while designing the PnID.

## Config

### Overview

Config files contain the "formatting behaviour" of pnid elements, meaning they define how a pnid element's style reacts to inputs (which colours to choose when), how to format the incoming data to a human readable value, how to link to other elements and how their popups should look and behave like. There are two config files, `config.json` which is the default config meant to be used for types of elements (i.e. All Solenoid valves get a default behaviour there) and `customConfig.json` which is the custom config that overrides the default config for one or more specific elements. The default config is a dictionary of pnid element types while the custom config is parsed top to bottom. This means that if several behaviour blocks apply to one element, the effects of the last one will override the previous ones. Similarly, the default config is parsed before the custom config, so anything that happens in the custom config will override (and/or extend) default behaviour.

For example if there is a behaviour in the default config setting the colour of an element based on the received value and another behaviour in the custom config changing the formatting of the value output, both outputs will be visible. If however the custom behaviour changes the formatting of the value output AND sets another colour, it will overwrite the colour set by the default config.

Additionally (and optionally) to that there is also
- `thresholds.json` which contains dictionaries of values to be used in the behaviour scripts. This is not needed, but for longer/more complex configs this is useful as it allows to define certain thresholds (e.g. the threshold value at which a solenoid is considered to be turned on) "globally" and if this changes it can be globally changed. It also reduces the amount of "magic numbers" used in behaviour blocks and as such serves for self-documenting limits/behaviours.

and

- `grafanaPanelConfig.json` which contains a dictionary of value references that map to grafana panel configs. This is (as may be evident from the name) used to map PnID element identifiers to the (semi-arbitrary) panel IDs from grafana to allow displaying grafana graphs in popups.

### Grafana Panel Config

To enable embedding iframes, every element with an iframe may need a specific url to be loaded. This is defined
in the grafana panel config (renaming required, it's currently 4 o'clock, I want to go home :P). If grafana is 
used with a fresh setup, following command may be used inside the browser console. It is required that the grafana dashboard in question including the panels needed are opened up inside this tab.

```js
var panelData = {}; $("[data-panelid]").each(function(){panelData[$(this).find(".panel-title h2").html()] = $(this).attr("data-panelid");})
console.log(panelData)
```

There's no guarantee this works with newer grafana versions (i.e. newer than v8.3.4). Copy the generated json object into the config file
That's it.

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
      "type": "input",
      "style": "checkbox",
      "variable": "value"
    }
  ]
}
```

The default config also contains the key `externalSourceDefault` which can be used to set a default source for popup display elements of the "external" type (See [popups](#popup-definitions)).

The subsections [eval behaviour blocks](#eval-behaviour-blocks) and [popup definitions](#popup-definitions) contain more info for their respective configs.

### Custom Config

The custom config is able to override the *behaviour* parts of the default config, but *cannot implement individual popup definitions*. In here a top level entry can be named to anything arbitrary as its only used for human readability and structuring. In this top level entry a list of `states` which should adopt this custom behaviour is specified. The states are identified by using the *value reference*.

*TODO: Allow custom config to override popup definitions (not extend, completely replace from default ones). This is needed for the ability to include other variables into a popup (eg: for computed states) because otherwise all elements of this type will have the same computed states which makes no sense*

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
}
```

*Note: All [eval behaviour blocks](#eval-behaviour-blocks) in the custom config can use the resulting outVars from the eval block in the default config because the default config is (if present) guaranteed to be executed before. This means the custom config eval can use the computed `outVars['value']` or `outVars['color']` as an "input" value. This is helpful to keep things in sync even with changes to the default config thresholds. Not needed that much if the thresholds dictionary is properly in use as changes there are already centralized, but can reduce length of custom config eval.*

### Eval behaviour blocks

The eval blocks contain behaviours for elements. Which ones they apply to depends on where they are used (in [default config](#default-config) or [custom config](#custom-config) and which identifiers it is used alongside). Eval blocks are as the name suggests blocks of JS code that will be run using the `eval()` function. Yes, this can be a huge security risk, no it's not an issue as this is only run locally and the content of the eval blocks cannot be changed by a user (nevermind an outside user) during runtime.

For ease of use there is a list of variables intended as inputs and outputs to the eval blocks, as well as some functions which cover the most important use cases for them. Technically if a necessary input or output does not exist (or a certain function is not provided) it can be added in the eval as it is fully featured JS, but it is preferable to extend the features of the inputs and outputs instead to use simpler behaviour code in the configs.

Input variables (addressable via `inVars["<variable name>"]`):
* `this` - contains the name (string) of the state that was invoked.
* `value` - contains the (new) value of the element that is being updated.
* `setState` - contains the setState value (set point of the actuator). May not be set to a sensible value if a) the PnID element is just a sensor, not an actuator b) there hasn't been a set point specified yet.
* `unit` - contains the unit (usually appended to the value) of the element that is being updated.

Output variables (addressable via `outVars[<variable name>]`), only have an effect if set by the eval block:
* `color` - tries to set the color of the *parent* element to the value of this variable. Which colors are valid depends on the type of element (see [pnid.css](client/css/pnid.css) `data-pnid-` declarations for valid values). Value "content" is allowed as a "variable" which evaluates to the color based on the content of the element. This needs the `data-content` attribute to be set in KiCad. For example a pressure sensor could have the content "fuel", in which case the `data-content` value in color evaluates to "fuel". Additionally, elements that don't have their own `data-content` attribute set can still use this if they are linked to another element that has. A wire for example doesn't have its own content attribute, but if it's linked to a pressure sensor that has, it will backtrack this link and use the content from the linked pressure sensor. This also allows one wire to have different contents based on the state of the rest of the PnID (eg: based on the state of a 3 way valve). The element's own `data-content` attribute will always be preferred over a potential linked `data-content`, so if it has its own content and another element linked with content specified, it will not use the content from the linked element.
* `value` - overrides the value field with custom content.
* `content` - sets new `data-content` value. Can be used for sensors that see different content based on measurement, eg: Temperature sensor seeing warm water or cold water depending on measured temperature.
* `crossUpdate` - if set, passes content to updatePNID(stateList) to update another component (eg: a wire group) in the PnID. This allows updating components that would otherwise be unaffected by the current update message. **(EXPERIMENTAL!)**

Functions (call by function name):
* `link` - links one (or more) state to another (origin). Whenever the origin state receives a state update, the linked state does as well. Does *not* override state updates for the linked state, so those can potentially interfere.
  * Parameter `origin` - the name of the origin ("parent") state of the link.
  * Parameter `statesToLink` - A singular name or a list of names of the state that should be linked to the given origin.
  * Parameter `linkType` - TODO Valid types: "all", "value", "content". If none specified uses "all" per default. Invalid link type acts as if not linked.
* `unlink` - unlinks previously linked states.
  * Parameter `origin` - the name of the origin ("parent") state of the link that should be unlinked from.
  * Parameter `statesToUnlink` - A singular name or a list of names of the state that should be unlinked from the given origin. (Optional, if not specified it will default to "all" to unlink all linked states from given origin. "all" can also be explicitly specified).
  * Parameter `updateValue` - A value (state update) that should be passed to all previously linked states just after unlinking. (Optional, if not specified no state update on unlinking will happen).
  * Parameter `alwaysUpdate` - Whether or not to always send the updateValue or only if the element was actually linked before. Has no effect if updateValue is not set (can't update without value) or if statesToUnlink is set to "all" (as this only unlinks states that were linked before anyways, making this check redundant).

Additionally, for a more straightforward and adaptable use there is a `thresholds` array containing key values of interest, like pressure thresholds for the tanks, accessible via names, so the behaviour code is more easily readable (instead of a random number it's `thresholds['oxPressure']['low']`) and more centralized (changes to the thresholds only need to be changed in one place, not in every single behaviour block that uses these values).
For contents of the thresholds array, check the file [thresholds.json](client/config/thresholds.json)

### Popup definitions

A popup definition is a list (array) of "building blocks" that a popup can be made of. Each building block serves a self contained UI purpose, meaning there is no direct interaction between two blocks.
The individual building blocks are positioned one after another vertically with the first one being below the popup header containing the drag and drop move button, the title (which is the value reference of this element) and the close button for the popup. When a state update is received that updates a value from the popup, the new values are updated on all building blocks of the popup.

The building blocks are defined as a list of JSON key value pairs, where the `type` value defines which other keys to expect (Important to note: This "type" is not the same "type" as described in the [nomenclature](#nomenclature)!)
Possible types:
* `display` - Used to simply display data without any option for interaction.
* `input` - Used to create an input for a variable.

All types use `variable` as a "sub-key" which defines which variable to display/affect. It can always be left out which makes it default to `value` which is translated to the *value reference* of the element that the popup is opened at (or the action reference if one is set). This allows for customizing to show several different values in one popup such as computed values.
Additionally, all popup rows can have the key `collapsible` set to true (`"collapsible": true`), which hides the element (no matter if it's an input or a display type) behind an "eye" button that only shows the element on click. This is helpful for elements that are either unnecessary clutter most of the time or inputs that are potentially dangerous to accidentally click. To know what is behind a collapsible it's also possible to define a `collapsibleLabel` to show a text when the actual element is collapsed. If left out it will by default just say "Hidden".

*Note: The following description will use `word=` with an "=" sign at the end if the word in question is a key that has values assigned to it and `=word` if the word is a value that is assigned to a key.*

Sub-keys for type `display`:
* `style=`
  * `=text` - Simply displays the value as a text output (basically a copy of the value output in the PnID itself)
  * `=external` - Inserts an iframe into the popup. Needs additional keys to be set. *Worth noting: the external display type for popups is the only popup element type that can also contain information in the custom config, see further below for more information on that.*
    * `source=` - Either set a fully qualified URL or a path. If it's a valid URL (with scheme identifier, FQDN, etc) it will *replace* the value of the global `externalSourceDefault` key in the [default config](#default-config), if it's a path it will be *appended* to it. *Can be either omitted or set to "null" if no specification is needed or if it will be specified in the [custom config](#custom-config)*.
    * `autoID=` - If set to `true`, appends the popupID (which is either the value reference or action reference of the parent element) to the source path. Allows individually 'unique' URLs without needing to manually set the URL for each element in the config. Can be omitted which will cause it to default to `false`.
    * `width=` - Width of the iframe. Can be omitted and defaults to 300px.
    * `height=` - Height of the iframe. Can be omitted and defaults to 200px.
  * `=separator` - Adds a horizontal separator line to the popup.

Sub-keys for type `input`:
* `style=`
  * `=checkbox` - Display a checkbox
    * `low=` - Which value the "low" value is. This is the raw value that is sent, so for example "0", not "Closed". This is optional and defaults to 0.
    * `high=` - Similar to low, but for the high value
  * `=slider` - Display a slider
    * `min=` - Which value the minimal value of the slider is. Eg for a servo valve the "low" value could be `30000`. This is the raw (number) value sent to the PnID, not the formatted/interpreted value visible in the UI.
    * `max=` - Similar to min, but for the max value
    * `step=` - The step size of the slider.
  * `=numberEntry` - An input field for numbers. Displays and sets the target value for the hardware to hit and checks incoming sensor values to see whether the value has been set correctly (or has been acknowledged at all)
    * `min=` - The minimum number that can be entered
    * `max=` - The maximum number that can be entered
    * `suffix=` - A text suffix to the number, can be used for units, eg: "bar" or "ms"
    * `set_var=` - The variable/command name that sets a new value. Used for highlighting the input field if a new set value is received (from eg: a networked client), but the hardware doesn't react with an acknowledgement.
    * `poll_var=` - The variable/command name that gets the current value. Used for initializing the input field to whatever value is currently the target value for the hardware.
    * `action=` - A string that will be evaluated as JS (using eval) after the input is finished. Can do anything that you want it to do, but was used for triggering additional actions after the number input action was sent out.
  * `=button` & `buttonDanger` - Creates a button input. Button and button danger behave and configurate identically apart from button danger being styled red.
    * `label=` - Defines the text inside the button. If label is set to "value" or not defined it will default to using the name of the variable that the button drives.
    * `action=` See description of "action" in numberEntry.


As mentioned before in the `style=external` description, this is a popup element type that can be further specified in the custom config. It is specified similar to the popup config in the default config file, but only allows the "source" and "autoID" keys to be set:

```json
"human_readable_group_label": {
    "states": [
        "fuel_mid_bottom_tank_temp:sensor"
    ],
    "popup": {
        "source": "23",
        "autoID": false
    }
}
```

## pnid.css

When creating new states an element can have such as

```css
[data-pnid-valve_pneumatic=open] {
    stroke: var(--open);
}
```

It is *absolutely necessary* that the state begins with `data-pnid-` for the code in [changeValues.js](client/js/changeValues.js) to recognize it.

