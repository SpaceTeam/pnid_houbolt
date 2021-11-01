//todo: evaluate if default configs may benefit from having a state *blacklist* instead of a state *whitelist* like in the custom configs
let defaultConfig = {
    "externalSourceDefault": "http://192.168.3.7:3000/d-solo/K20EdKS7z/streaming-example?orgId=1&var-statesQuery=&var-state=&var-temp=All&var-pressure=All&var-thrust_load_cells=(%22key%22%3D'engine_thrust_1:sensor'%20or%0A%22key%22%3D'engine_thrust_2:sensor'%20or%0A%22key%22%3D'engine_thrust_3:sensor'%20or%0A%22key%22%3D'engine_thrust_4:sensor'%20or%0A%22key%22%3D'engine_thrust_5:sensor'%20or%0A%22key%22%3D'engine_thrust_6:sensor')&theme=light&panelId=",
    "PnID-Valve_Solenoid_NO": {
        "eval": "if (inVars['value'] > thresholds['solenoid']['high']) { outVars['color']='closed'; outVars['value']='Closed' } else { outVars['color']='open'; outVars['value']='Open' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "checkbox",
                "variable": "value",
                "low": "Open",
                "high": "Closed"
            }
        ]
    },
    "PnID-Valve_Solenoid_NC": {
        "eval": "if (inVars['value'] > thresholds['solenoid']['high']) { outVars['color']='open'; outVars['value']='Open' } else { outVars['color']='closed'; outVars['value']='Closed' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "checkbox",
                "variable": "value",
                "low": "Closed",
                "high": "Open"
            }
        ]
    },
    "PnID-Valve_Pneumatic": {
        "eval": "if (inVars['value'] > thresholds['servo_valve']['high']) { outVars['color']='open'; outVars['value']='Open ('+Math.round(inVars['value'])+')' } else if (inVars['value'] > thresholds['servo_valve']['low']) { outVars['color']='throttle'; outVars['value']='Thr. ('+Math.round(inVars['value'])+')' } else { outVars['color']='closed'; outVars['value']='Closed  ('+Math.round(inVars['value'])+')' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "slider",
                "variable": "value",
                "min": 0,
                "max": 65535,
                "step": 1
            }
        ]
    },
    "PnID-Valve_Servo": {
        "eval": "if (inVars['value'] > thresholds['servo_valve']['high']) { outVars['color']='open'; outVars['value']='Open ('+Math.round(inVars['value'])+')' } else if (inVars['value'] > thresholds['servo_valve']['low']) { outVars['color']='throttle'; outVars['value']='Thr. ('+Math.round(inVars['value'])+')' } else { outVars['color']='closed'; outVars['value']='Closed  ('+Math.round(inVars['value'])+')' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "slider",
                "variable": "value",
                "min": 0,
                "max": 65535,
                "step": 1
            }
        ]
    },
	"PnID-Valve_Needle_Servo": {
        "eval": "if (inVars['value'] > 80) { outVars['color']='open'; outVars['value']='Open ('+Math.round(inVars['value'])+')' } else if (inVars['value'] > 20) { outVars['color']='throttle'; outVars['value']='Thr. ('+Math.round(inVars['value'])+')' } else { outVars['color']='closed'; outVars['value']='Closed  ('+Math.round(inVars['value'])+')' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "slider",
                "variable": "value",
                "min": 0.0,
                "max": 100.0,
                "step": 1
            }
        ]
    },
    "PnID-Sensor_Pressure": {
        "eval": "if (inVars['value'] > 2) { outVars['color']='high' } else if (inVars['value'] > -8) { outVars['color']='low' } else { outVars['color']='notconnected'; outVars['value']='Not Connected' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "display",
                "style": "external",
                "source": undefined,
                "autoID": false,
                "width": 450,
                "height": 200
            }
        ]
    },
    "PnID-Sensor_Temperature": {
        "eval": "if (inVars['value'] > 30) { outVars['color']='high' } else if (inVars['value'] > -200) { outVars['color']='low' } else { outVars['color']='notconnected'; outVars['value']='Not Connected' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "display",
                "style": "external",
                "source": undefined,
                "autoID": false,
                "width": 450,
                "height": 200
            }
        ]
    },
    "PnID-Sensor_MassFlow": {
        "eval": "",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            }
        ]
    },
    "PnID-Tank": {
        "eval": "",
        "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "textEntry",
                "variable": "tank_fill_low"
            },
            {
                "type": "input",
                "style": "textEntry",
                "variable": "tank_fill_high"
            }
        ]
    },
    "PnID-LED": {
        "eval": "if (inVars['value'] > 3000) { outVars['color']='on'; } else { outVars['color']='off'; }"
    },
    "PnID-Engine_TorchIgniter": {
        "eval": "",
	    "popup": [
            {
                "type": "display",
                "style": "external",
                "source": undefined,
                "autoID": false,
                "width": 450,
                "height": 200
            }
        ]
    },
    "gui-fuel_press_depress": {
        "eval": "if (inVars['value'] > 0) { outVars['value']='Open' } else { outVars['value']='Closed' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "checkbox",
                "variable": "value",
                "low": "Closed",
                "high": "Open"
            }
        ]
    },
    "gui-ox_press_depress": {
        "eval": "if (inVars['value'] > 0) { outVars['value']='Open' } else { outVars['value']='Closed' }",
	    "popup": [
            {
                "type": "display",
                "style": "text",
                "variable": "value"
            },
            {
                "type": "input",
                "style": "checkbox",
                "variable": "value",
                "low": "Closed",
                "high": "Open"
            }
        ]
    }
};

$.get('/config/default', function(data) {
    //defaultConfig = data;
});

let config = {
    "pressure": {
        "states": [
            "chamber_pressure:sensor"
        ],
        "eval": "if (inVars['value'] > thresholds['chamberPressure']['high']) { outVars['color']='high' } else if (inVars['value'] > thresholds['chamberPressure']['low']) { outVars['color']='neutral' } else { outVars['color']='low' }"
    },
    "temperature_oxidizer_tank": {
        "states": [
            "ox_top_tank_temp:sensor",
            "ox_mid_top_tank_temp:sensor",
            "ox_mid_bottom_tank_temp:sensor",
            "ox_bottom_tank_temp:sensor"
        ],
        "eval": "if (inVars['value'] > thresholds['oxTemp']['high']) { outVars['color']='high' } else if (inVars['value'] > thresholds['oxTemp']['low']) { outVars['color']='neutral' } else { outVars['color']='low' }"
    },
    "purge_solenoid_pressure": {
        "states": [
            "purge_solenoid:sensor"
        ],
        "eval": "if (inVars['value'] > 0) { outVars['color']='open'; outVars['value']='Open' } else { outVars['color']='closed'; outVars['value']='Closed'; outVars['crossUpdate']=[{'name':'purge_solenoid_wire','value':2.1}] }"
    },
    "purge_solenoid_wire_pressure": {
        "states": [
            "purge_regulator_pressure:sensor"
        ],
        "eval": "if (inVars['value'] > 2) { outVars['color']='high' } else { outVars['color']='low' } if ($(document).find('g.purge_solenoid').find('text.value').text() === 'Open') { outVars['crossUpdate']=[{'name':'purge_solenoid_wire', 'value':inVars['value']}] } else { outVars['crossUpdate']=[{'name':'purge_solenoid_wire','value':2.1}] }"
    },
    "igniter_ox_pressure_wire_update": {
        "states": [
            "igniter_ox_solenoid:sensor"
        ],
        "eval": "if (inVars['value'] > thresholds['solenoid']['high']) { link('igniter_ox_regulator_pressure:sensor', 'igniter_ox_pressure:sensor'); } else { unlink('igniter_ox_regulator_pressure:sensor', 'igniter_ox_pressure:sensor', 0); }"
    },
    "igniter_fuel_pressure_wire_update": {
        "states": [
            "igniter_fuel_solenoid:sensor"
        ],
        "eval": "if (inVars['value'] > thresholds['solenoid']['high']) { link('igniter_fuel_regulator_pressure:sensor', 'igniter_fuel_pressure:sensor'); } else { unlink('igniter_fuel_regulator_pressure:sensor', 'igniter_fuel_pressure:sensor', 0); }"
    },
    "fuel_bottom_tank_pressure:sensor": {
        "states": [
            "fuel_bottom_tank_pressure:sensor"
        ],
        "popup": {
            "source": "11",
            "autoID": false
        }
    },
    "fuel_main_pressure:sensor": {
        "states": [
            "fuel_main_pressure:sensor"
        ],
        "popup": {
            "source": "14",
            "autoID": false
        }
    },
    "fuel_pressurant_regulator_pressure:sensor": {
        "states": [
            "fuel_pressurant_regulator_pressure:sensor"
        ],
        "popup": {
            "source": "15",
            "autoID": false
        }
    },
    "fuel_top_tank_pressure:sensor": {
        "states": [
            "fuel_top_tank_pressure:sensor"
        ],
        "popup": {
            "source": "16",
            "autoID": false
        }
    },
    "igniter_fuel_regulator_pressure:sensor": {
        "states": [
            "igniter_fuel_bottle_pressure:sensor"
        ],
        "popup": {
            "source": "17",
            "autoID": false
        }
    },
    "igniter_ox_regulator_pressure:sensor": {
        "states": [
            "igniter_ox_bottle_pressure:sensor"
        ],
        "popup": {
            "source": "18",
            "autoID": false
        }
    },
    "ox_bottom_tank_pressure:sensor": {
        "states": [
            "ox_bottom_tank_pressure:sensor"
        ],
        "popup": {
            "source": "19",
            "autoID": false
        }
    },
    "ox_pressurant_regulator_pressure:sensor": {
        "states": [
            "ox_pressurant_regulator_pressure:sensor"
        ],
        "popup": {
            "source": "20",
            "autoID": false
        }
    },
    "ox_top_tank_pressure:sensor": {
        "states": [
            "ox_top_tank_pressure:sensor"
        ],
        "popup": {
            "source": "21",
            "autoID": false
        }
    },
    "purge_bottle_pressure:sensor": {
        "states": [
            "purge_bottle_pressure:sensor"
        ],
        "popup": {
            "source": "22",
            "autoID": false
        }
    },
    "fuel_bottom_tank_temp:sensor": {
        "states": [
            "fuel_bottom_tank_temp:sensor"
        ],
        "popup": {
            "source": "12",
            "autoID": false
        }
    },
    "fuel_mid_bottom_tank_temp:sensor": {
        "states": [
            "fuel_mid_bottom_tank_temp:sensor"
        ],
        "popup": {
            "source": "23",
            "autoID": false
        }
    },
    "fuel_mid_top_tank_temp:sensor": {
        "states": [
            "fuel_mid_top_tank_temp:sensor"
        ],
        "popup": {
            "source": "24",
            "autoID": false
        }
    },
    "fuel_top_tank_temp:sensor": {
        "states": [
            "fuel_top_tank_temp:sensor"
        ],
        "popup": {
            "source": "25",
            "autoID": false
        }
    },
    "ox_bottom_tank_temp:sensor": {
        "states": [
            "ox_bottom_tank_temp:sensor"
        ],
        "popup": {
            "source": "26",
            "autoID": false
        }
    },
    "ox_mid_bottom_tank_temp:sensor": {
        "states": [
            "ox_mid_bottom_tank_temp:sensor"
        ],
        "popup": {
            "source": "27",
            "autoID": false
        }
    },
    "ox_mid_top_tank_temp:sensor": {
        "states": [
            "ox_mid_top_tank_temp:sensor"
        ],
        "popup": {
            "source": "28",
            "autoID": false
        }
    },
    "ox_top_tank_temp:sensor": {
        "states": [
            "ox_top_tank_temp:sensor"
        ],
        "popup": {
            "source": "29",
            "autoID": false
        }
    },
    "Engine_TorchIgniter": {
        "states": [
            
        ],
        "popup": {
            "source": "13",
            "autoID": false
        }
    }
};

$.get('/config/custom', function(data) {
    //config = data;
});

let thresholds = {
    "solenoid": {
        "high": 3000
    },
    "servo_valve": {
        "low": 10000,
        "high": 55000
    },
    "oxPressure": {
        "low": 32.0,
        "high": 42.0,
        "safe": 2.0
    },
    "oxTemp": {
        "low": 2.0,
        "high": 35.0
    },
    "fuelPressure": {
        "low": 30.0,
        "high": 34.0,
        "safe": 2.0
    },
    "chamberPressure": {
        "low": 7.0,
        "high": 9.0
    }
};

$.get('/config/thresholds', function(data) {
    //thresholds = data;
});

//setup tanks for filling visuals
function initTanks()
{
    let tanks = $(document).find("g.PnID-Tank");
    let fuelPaths = tanks.filter(".fuel_tank").find("path[d*=' A ']").last();
    let oxPaths = tanks.filter(".ox_tank").find("path[d*=' A ']").last();
    fuelPaths.attr(`data-pnid-tank_content`, `fuel`);
    oxPaths.attr(`data-pnid-tank_content`, `ox`);
    initTankContent(tanks);
}

function initTankContent(tanks)
{
    //let fuelPaths = extractArcPathsFromTank(tanks.filter(".fuel_tank"));
    //let oxPaths = extractArcPathsFromTank(tanks.filter(".ox_tank"));

    let fuelContentRect = tanks.filter(".fuel_tank").find("g").find("rect.rect");
    let fuelTransformOriginY = +fuelContentRect.attr("y") + +fuelContentRect.attr("height");
    fuelContentRect.attr("data-pnid-tank_content", "fuel");
    fuelContentRect.attr("transform-origin", `center ${fuelTransformOriginY}`);
    fuelContentRect.attr("transform", "scale(1,0)");

    let oxContentRect = tanks.filter(".ox_tank").find("g").find("rect.rect");
    let oxTransformOriginY = +oxContentRect.attr("y") + +oxContentRect.attr("height");
    oxContentRect.attr("data-pnid-tank_content", "ox");
    oxContentRect.attr("transform-origin", `center ${oxTransformOriginY}`);
    oxContentRect.attr("transform", "scale(1,0)");
}

//update the percent of the content that is filled
function updateTankContent(tank, fillPercent)
{
    let contentRect = tank.find("g").find("rect.rect");
    let scale = fillPercent / 100.0;
    contentRect.attr("transform", `scale(1,${scale})`);
}

//extract the curved paths from a tank to fill them in tank color
//this code relies on tanks being upright, very likely that it breaks if a tank is turned on its side
function extractArcPathsFromTank(tank)
{
    let contentPaths = tank.find("path[d*=' L ']");
    let minPathX = 9999999;
    let maxPathX = 0;
    let pathY = 0;
    for (pathIndex in contentPaths) {
        if (pathIndex === "length") {
            break;
        }
        let pos = extractXYFromPath(contentPaths[pathIndex]);
        if (pos[0] < minPathX) {
            minPathX = pos[0];
            pathY = pos[1];
        }
        else if (pos[0] > maxPathX) {
            maxPathX = pos[0];
            pathY = pos[1];
        }
    }
    return [tank.find(`path[d*='${minPathX} ${pathY} L']`), tank.find(`path[d*='${maxPathX} ${pathY} L']`)];
}

//extract XY position from start point of path
function extractXYFromPath(path)
{
    pathAttr = $(path).attr("d").split(" ");
    return [pathAttr[1], pathAttr[2]];
}

async function runTests()
{
	var testNames = [{"name": "fuel_top_tank_temp:sensor", "label": "hope so"}, {"name": "ox_pressurant_press_pressure:sensor", "label": "adf"}];
	setStateNamesPNID(testNames);
	var testData = [{"name": "purge_regulator_pressure:sensor", "value": "95.0"}, {"name": "fuel_tank", "value": 95.0}, {"name": "fuel_top_tank_temp:sensor", "value": "27"}, {"name": "purge_solenoid:sensor", "value": "1.0"}, {"name": "ox_pressurant_regulator_pressure:sensor", "value": "30.0"}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "oxfill_vent_valve:sensor", "value": "10"}, {"name": "fuel_bottom_tank_temp:sensor", "value": "101"}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "fuel_depressurize_solenoid:sensor", "value": 5000.0}, {"name": "oxfill_vent_valve:sensor", "value": 50}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "purge_solenoid:sensor", "value": 6.0}, {"name": "fuel_pressurize_solenoid:sensor", "value": 10000.0}, {"name": "oxfill_vent_valve:sensor", "value": 80}, {"name": "ox_top_tank_temp:sensor", "value": 22}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "fuel_tank", "value": 50.0}, {"name": "purge_regulator_pressure:sensor", "value": 1.5}, {"name": "ox_tank", "value": 30.0}, {"name": "ox_mid_bottom_tank_temp:sensor", "value": 5}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "ox_top_tank_pressure:sensor", "value": 32.0}, {"name": "fuel_tank", "value": 5.0}, {"name": "ox_bottom_tank_temp:sensor", "value": -4}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "ox_bottom_tank_pressure:sensor", "value": 32.0}, {"name": "purge_solenoid:sensor", "value": 0.0}, {"name": "ox_top_tank_pressure:sensor", "value": 0.5}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "ox_bottom_tank_pressure:sensor", "value": 0.0}, {"name": "chamber_pressure:sensor", "value": 40}, {"name": "ox_depressurize_solenoid:sensor", "value": 20.0}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "fuel_pressurize_solenoid:sensor", "value": 5.0}, {"name": "fuel_depressurize_solenoid:sensor", "value": 1.0}];
	updatePNID(testData);
	await sleep(500);
}

function test()
{
    console.log(activePopups);
}

function runRandom()
{
	var states = [];
	$("g.comp").each(function(index)
	{
		var state = {};
        let name = $(this).attr("class").split(" ")[2];
        if (name !== "comp" && name !== "wire" && name !== "")
        {
            state["name"] = name.replace(":state", "");
		    state["value"] = (Math.random()*100).toPrecision(4);
		    if (state["name"] != " ")
			{
				states.push(state);
			}
        }
	});
	updatePNID(states);
}

var randInterval;
function runRandomLoop(interval)
{
    randInterval = setInterval(() => {
        runRandom();
    }, interval);
}

function stopRandomLoop()
{
    clearInterval(randInterval);
}

function setStateNamesPNID(stateNameList)
{
	for (stateIndex in stateNameList)
	{
		//let stateName = stateNameList[stateIndex]["name"];
		//let stateValue = stateNameList[stateIndex]["value"];
		//printLog("info", "updating pnid for state name: '" + stateName + "' value: " + stateValue);
		setStateName(stateNameList[stateIndex]);
	}
}

function setStateName(state)
{
	let elementGroup = $(document).find("g." + state["name"].replace(":","-"));
	if (elementGroup.length === 0)
	{
		return;
	}

	elementGroup.find("text.reference").text(state["label"]);
}

/**
 * @typedef {Object} State
 * @property {string} name The name of the state.
 * @property {number} value The value of the state.
 * @example {"name": "statename", "value": 123.4}
 */

/**
 * @typedef {Object[]} StateList
 * @property {State} state An individual state in the state list.
 * @example [{"name": "statename", "value": 123.4}, {"name": "another_statename", "value": 1.2}]
 */

/**
 * @summary Updates the PnID based on the list of given state updates.
 * @description Takes the {@link StateList}, iterates through every state and updates the corresponding PnID elements with the new state values by passing each state to {@link setState}.
 * @param {StateList} stateList The list of states that should be updated.
 * @example updatePNID([{"name": "a_cool_state_name", "value": 123.4}]);
 */
function updatePNID(stateList)
{
	//printLog("info", "Updating PnID with: " + stateList);
	
	for (stateIndex in stateList)
	{
		//let stateName = stateList[stateIndex]["name"];
		//let stateValue = stateList[stateIndex]["value"];
		//printLog("info", "updating pnid for state name: '" + stateName + "' value: " + stateValue);
		setState(stateList[stateIndex]);
	}
	
	//$('.' + stateList[0].name).eval(config[stateName]["eval"])
}

/**
 * @summary A dictionary of state links.
 * @description When two states get linked the information about this link is kept in here. The link consists of a dictionary entry of the origin state (with the state name being the identifier) which contains an array of states it is linked to.
 * @property {Object} origin The origin of a link. Key is the name of the origin state, value is an array of linked states. On a state update (via {@link updatePNID}) all states that are linked in this entry will be invoked.
 * @property {string[]} origin.statename An array of state names that is linked to another state name (the key of the object)
 */
var __stateLinks = {};

/**
 * @summary Links one state to another.
 * @description When a state is linked to another it will be called via a state update (using {@link updatePNID}) using the same value as the invoking state. Intended to be used inside eval behavior blocks.
 * @param {string} origin The name of the state that invokes the linked state.
 * @param {string[]} statesToLink The name of the state that should be invoked on state update. Can be an array of several state names or just a single state name.
 * @todo consider adding an "update" function so on link time the linked state is updated to its origin so it doesn't have to wait until a new update from origin comes in to update. not really needed for us, but may still be worth to do
 * @todo consider adding a toggle/flag for preventing state updates for the linked-to state to be executed (This would completely "remove" the linked state from state updates and make it completely depend on the origin state). Not needed for our purposes as all the states we want linked don't have their own state update (which is why we need to link them) but maybe it could be useful in the future.
 * @see unlink
 */
function link(origin, statesToLink)
{
    let statesArray = [];
    if (!Array.isArray(statesToLink)) //if the parameter is not an array, convert it to an array with a single element
    {
        statesArray.push(statesToLink);
    }

    origin = origin.replace(":","-");
    for (let i in statesArray)
    {
        let state = statesArray[i].replace(":","-");
        let existingLinks = __stateLinks[origin];
        if (existingLinks == undefined || existingLinks.length == 0)
        {
            existingLinks = [state];
        }
        else
        {
            if (!existingLinks.includes(state))
            {
                existingLinks.push(state);
            }
        }
        __stateLinks[origin] = existingLinks;
    }
}

/**
 * @summary Unlinks a previously made state link.
 * @description Removes a link from {@link __stateLinks} to stop a state to be invoked on the update of another. Intended to be used inside eval behavior blocks.
 * @param {string} origin The name of the state that invokes the linked state.
 * @param {string[]} [statesToUnlink=all] The name of the state that should be unlinked from being invoked on change of origin state. Can be an array of several state names or just a single name. Default value if not specified is "all", which unlinks all active links from the specified origin state.
 * @param {number=} updateValue If specified sends a state update (using {@link updatePNID}) to the element that should be unlinked (even if it wasn't linked to begin with).
 * @see link
 */
function unlink(origin, statesToUnlink = "all", updateValue = undefined)
{
    let statesArray = [];
    let unlinkUpdate = [];
    if (!Array.isArray(statesToUnlink))
    {
        statesArray.push(statesToUnlink);
    }
    origin = origin.replace(":","-");
    if (statesToUnlink == "")
    {

    }
    for (let i in statesArray)
    {
        let state = statesArray[i].replace(":","-");
        let existingLinks = __stateLinks[origin];
        if (existingLinks != undefined && existingLinks.length > 0)
        {
            let resultIndex = existingLinks.indexOf(state); //search for the location of the state in the existing links, -1 if not in the list.
            if (resultIndex != -1)
            {
                existingLinks.splice(resultIndex, 1); //remove item from array
            }
            if (existingLinks.length == 0)
            {
                delete __stateLinks[origin];
            }
            else
            {
                __stateLinks[origin] = existingLinks;
            }
        }
        if (updateValue != undefined)
        {
            unlinkUpdate.push({"name": state, "value": updateValue})
        }
    }
    if (updateValue != undefined)
    {
        updatePNID(unlinkUpdate);
    }
}

/**
 * @summary Links wires and sensors with the same name.
 * @description Creates all implicit links between sensors and wires. Wires are implicitly linked to a sensor when they have the same state name. Uses {@link link} to link the states together.
 */
function createWireLink()
{

}

function setState(state)
{
    if (typeof state["value"] != "number")
    {
        if (!checkStringIsNumber(state["value"]))
        {
            printLog("error", "Received a state update with a value that is not a number: \"" + state["name"] + "\": \"" + state["value"] + "\". Skipping to next state update.");
            return;
        }
    }
    
    state["name"] = state["name"].replace(":","-");
    if (typeof state["value"] != "string")
    {
        state["value"] = Math.round((state["value"] + Number.EPSILON) * 100) / 100;
    }
    
    let isActionReference = false;
    let elementGroup = getElement(state["name"]);

	// check if any pnid element is found with the provided state name
	let unit = "";
	if (elementGroup.length !== 0) // if an element is found, update it. then carry on with the rest because even if it's not a pnid element the incoming state may be an action reference for a popup
	{
		unit = elementGroup.not("g.wire").not("g.PnID-ThermalBarrier").attr("data-unit"); //exclude thermalbarrier from unit search (only the corresponding pressure sensor has a unit set) //TODO I dislike that this is hardcoded, but don't know how else to do that
        //raw value without any processing
        let valueRawElement = getElement(state["name"], "valueRaw");
        valueRawElement.text(state["value"]);
        //human visible value that may contain units or further processing
        let valueElement = getElement(state["name"], "value");
	    valueElement.text(state["value"] + unit);
	    //printLog("info", "Found following elements to update: " + $(document).find("g." + state["name"]));
	}
	else
    {
        elementGroup = getElement(state["name"], "parent", true);

        if (elementGroup.length !== 0)
        {
            isActionReference = true;
            
            let actionRefValueRawElement = getElement(state["name"], "actionReferenceRawValue", true);
            let actionRefValueElement = getElement(state["name"], "actionReferenceValue", true);
            actionRefValueRawElement.text(state["value"]);
            actionRefValueElement.text(state["value"]);
        }
    }
	
    //----- prepare for eval behavior block
    //In Variables for the eval() code specified in config.json. Will be reset/overwritten for every state and every loop
	const inVars = {
        "this": state["name"],
	    "value" : state["value"],
	    "unit" : unit
    };
    
    //State storage for the eval() code specified in config.json //TBD (let eval code create entries? pre-define generic name entries? are they even persistent between loops right now?)
    var stateVars = { };
    
    //Return values from eval() code specified in config.json. Will be applied to PnID and cleared for every state and every loop
    let outVars = { };
    
    //----- search applicable eval behavior blocks from config files (either default config or custom config)
    //create list of possible entries in the default or custom JSON
    //config search terms is a 2d array, one array for each element that has been found that matched the state name.
    let configSearchTerms = []; //TODO configSearchTerms is not the best name, find another one
    if (isActionReference) //if the state update is an action reference, use its name as search term, else get the classes of the pnid element, one of these will (hopefully) be contained in the default or custom config
    {
        configSearchTerms.push([state["name"]]);
    }
    else
    {
        //unpack each found element's classes individually
        elementGroup.each(function(index) {
            configSearchTerms.push($(this).attr("class").split(" "));
        });
    }
    //iterate through all elements found (only one in case of action references)
    for (let i in configSearchTerms)
    {
        //iterate through search terms (classes for elements, action references for... action references) within one element
        for (let index in configSearchTerms[i]) //search through attributes to find class attribute related to type (eg: PnID-Valve_Manual)
        {
	        let searchTerm = configSearchTerms[i][index];
	        if (configSearchTerms[i].includes("wire") || configSearchTerms[i].includes("PnID-ThermalBarrier"))
	        {
		        searchTerm = "PnID-Sensor_Pressure"; //should this really be hardcoded? is there a reason for it to have to be dynamic? evaluate
	        }

	        //search for the search term in the default config and run the eval behavior code and run special update tank content function (if applicable)
	        let evalCode = getConfigData(defaultConfig, searchTerm, "eval");
	        if (evalCode != undefined)
	        {
	            eval(evalCode);
	            if (searchTerm === "PnID-Tank")
                {
                    updateTankContent(elementGroup, state["value"]);
                }
	        }
        }

        //traverse custom JSON to find all evals applicable to current element. evals later in JSON overwrite changes made by evals earlier (if they change the same parameters)
        let customEvalCode = getConfigData(config, state["name"].replace("-",":"), "eval");
        if (customEvalCode != undefined)
        {
            eval(customEvalCode);
        }

        //if there is a pnid element, update it
        if (elementGroup.length !== 0)
        {
            applyUpdatesToPnID(elementGroup.eq(i), outVars, isActionReference); //TODO this part is kinda weird - I don't understand why in case of action references it actually updates all elements. but it does. so whatever I guess?
        }
        else
        {
            printLog("warning", `Received state update with no corresponding pnid element or action reference! State: ${state["name"]}: ${state["value"]}`);
        }
    }
    
    //update the popup corresponding to the state name. if there is none, update popups will return without doing anything. the state name could be either for a pnid element or a popup for an action reference
    if (outVars["value"] == undefined)
    {
        outVars["value"] = state["value"] + unit;
    }
    updatePopup(state["name"], outVars["value"], state["value"]);

    //iterate through all elements linked to this one
    let linkedStateUpdates = [];
    for (let linkIndex in __stateLinks[state["name"]])
    {
        linkedStateUpdates.push({"name": __stateLinks[state["name"]][linkIndex], "value": state["value"]});
    }
    if (linkedStateUpdates.length > 0)
    {
        updatePNID(linkedStateUpdates);
    }
}

function applyUpdatesToPnID(elementGroup, outVars, isActionReference)
{
	//fetch all attributes of the element group
	let attributes = elementGroup.prop("attributes");
	//printLog("info", "Found these attributes:" + attributes);
	
	//apply all outVars to PnID
	if ("color" in outVars && !isActionReference)
	{
		for (attrIndex in attributes)
		{
            //console.log("attr", attributes[attrIndex]);
			if (attrIndex == "length") //otherwise JS also iterates over control elements in the array for whatever stupid reason
			{
				break;
			}
			let attribute = attributes[attrIndex];
			let re = /data-pnid-\S*/;
			if (re.test(attribute.name))
			{
				elementGroup.attr(attribute.name, outVars["color"]);
			}
		}
	}
	if ("value" in outVars)
	{
        if (isActionReference)
        {
            elementGroup.find("text.actionReferenceValue").text(outVars["value"]);
        }
        else
        {
            elementGroup.find("text.value").text(outVars["value"]);
        }
	}
	if ("crossUpdate" in outVars)
	{
		updatePNID(outVars["crossUpdate"]);
	}
}

function setConfig()
{

}

function saveConfig()
{
	
}

function sleep (time)
{
	return new Promise((resolve) => setTimeout(resolve, time));
}
