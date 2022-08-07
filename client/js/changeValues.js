//todo: evaluate if default configs may benefit from having a state *blacklist* instead of a state *whitelist* like in the custom configs
let defaultConfig = {};
$.get('/pnid_config/default', function(data) {
    //console.log("default");
    //console.log("default:", data);
    defaultConfig = data;
});

let config = {};
$.get('/pnid_config/custom', function(data) {
    //console.log("custom:", data);
    config = data;
});

let thresholds = {};
$.get('/pnid_config/thresholds', function(data) {
    thresholds = data;
});

/**
 * @summary Initializes tanks for fill level visuals.
 * @description Finds the correct rect element to scale, enters the right content type and passes the tanks to {@link initTankContent}.
 * @todo The entire system of tank contents is super hardcoded and not nice as it's one of the only things that isn't properly generalized and configurable. definitely needs a refactor, but I have no idea how I'd do that short of constructing my own hitboxes which is a pain
 */
function initTanks()
{
    let tanks = $(document).find("g.PnID-Tank, g.PnID-Tank_Slim");
    //console.log("tanks", tanks);
    initTankContent(tanks);
}

/**
 * @summary Initializes tank fill level rectangles for use.
 * @description Iterates through all provided tanks and finds the rect element that is used to scale with fill level. The transform origin of the rectangle is set to the bottom edge of the tank so in future one can simply use scale along Y.
 * @param {jQuery} tanks jQuery DOM elements of the ox and fuel tank.
 */
function initTankContent(tanks)
{
    for (let tank of tanks) {
        let content = $(tank).attr("data-content");

        //init the bottom curve on the tank
        let paths = $(tank).find("path[d*=' A ']").last();
        paths.attr(`data-pnid-tank_content`, content);

        //init the content rectangle
        let contentRect = $(tank).find("g").find("rect.rect");
        let transformOriginY = +contentRect.attr("y") + +contentRect.attr("height");
        contentRect.attr("data-pnid-tank_content", content);
        contentRect.attr("transform-origin", `center ${transformOriginY}`);
        contentRect.attr("transform", "scale(1,0)");
    }
}

/**
 * @summary Initializes pumps for rotation animation.
 * @description Essentially just sets the appropriate transform origin for the elements that should rotate.
 */
function initPumps()
{
    let pumps = $(document).find("g.PnID-Pump");
    let pumpGroups = pumps.find("g");
    pumpGroups.each(function (index) {
        //console.log("init pump group", pumpGroups.eq(index));
        //init the "X" part for rotation
        let paths = pumpGroups.eq(index).find("path[d*=' L ']").slice(0,2); //we only want the first two elements as only those are the ones we want to rotate. technically doing more isn't "wrong", just unneccesary work.
        paths.each(function (pathIndex) {
            let pathCoords = extractXYFromPath(paths.eq(pathIndex));
            let pathCenter = [(+pathCoords[0] + +pathCoords[2])/2, (+pathCoords[1] + +pathCoords[3])/2];
            paths.eq(pathIndex).attr("transform-origin", `${pathCenter[0]} ${pathCenter[1]}`);
        });

        //get the inner circle to be drawn after the outer circle for proper draw order. I hate that this is in here, but I can't think of a better way to put it into the parser without having to give the parser tons of logic. could be fixed by maybe editing the pnid lib to get the parser to generate in the right order? that sucks though.
        let minR = 10000; //some high number
        let maxR = 0; //some low number
        let smallestCircle = undefined;
        let biggestCircle = undefined;
        let circles = pumpGroups.eq(index).find("circle");
        circles.each(function(circleIndex) {
            let curR = parseFloat(circles.eq(circleIndex).attr("r"));
            if (curR < minR)
            {
                minR = curR;
                smallestCircle = circles.eq(circleIndex);
                //console.log("found new smallest circle:", minR, smallestCircle);
            }
            if (curR > maxR)
            {
                maxR = curR;
                biggestCircle = circles.eq(circleIndex);
                //console.log("found new biggest circle:", maxR, biggestCircle);
            }
        });
        smallestCircle.insertAfter(biggestCircle);
        smallestCircle = undefined;
        biggestCircle = undefined;
    });
}

function hasInternalControl()
{
    if (getElement("rocket-sensor").length == 0)
    {
        return false;
    }
    return true;
}

function getRocketInternalStateName()
{
    return getElementValue("rocket-sensor", "value");
}

//update the percent of the content that is filled
/**
 * @summary Updates tank fill level to a specified percentage.
 * @description Sets the fill level of the specified tank to the specified percentage using transform: scale(). Needs the tanks to be initialized prior with {@link initTanks}
 * @param {jQuery} tank The jQuery DOM element of the tank that should be updated.
 * @param {number} fillScale The (floating point) fill level (form 0 to 1)
 */
function updateTankContent(tank, fillScale)
{
    let contentRect = tank.find("g").find("rect.rect");
    //console.log("content rect", contentRect);
    contentRect.attr("transform", `scale(1,${fillScale})`);
}

//extract the curved paths from a tank to fill them in tank color
//this code relies on tanks being upright, very likely that it breaks if a tank is turned on its side
/**
 * @summary Extracts arc paths from certain path elements in a tank.
 * @deprecated Not needed in the current tank implementation, may be needed for a possible future refactor.
 * @param {jQuery} tank The jQuery DOM element of the tank that should be looked at.
 * @return {Array} The svg element of the lowest left and highest right path
 * @todo Evaluate if this may be needed for tank refactor, remove if not. If it is needed, update docs, I think I misdescribed the return value but idc because I think I'll delete this function soon anyways.
 */
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

/**
 * @summary Extracts coordinates from certain path elements in a tank.
 * @param {jQuery} path The jQuery DOM element of the path that should be looked at.
 * @return {Array} The start and end x and y coordinates of the path. Ordered by startX, startY, endX, endY.
 */
//extract XY position from start point of path
function extractXYFromPath(path)
{
    pathAttr = $(path).attr("d").split(" ");
    return [pathAttr[1], pathAttr[2], pathAttr[4], pathAttr[5]]; //returns startX, startY, endX, endY
}


/**
 * @summary Test function for running through some of the more important functions of the PnID to validate them.
 * @description Sets some state's names using {@link setStateNamesPNID}, then proceeds to send some manually entered, static test data spread out over time using {@link updatePNID}.
 * @see runRandom
 */
async function runTestsFranz()
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

/**
 * @summary Test function for running through some of the more important functions of the PnID to validate them.
 * @description Sets some state's names using {@link setStateNamesPNID}, then proceeds to send some manually entered, static test data spread out over time using {@link updatePNID}.
 * @see runRandom
 */
async function runTestsHoubolt()
{
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 93.0}, {"name": "water_hot_temp:sensor", "value": 30.0}, {"name": "water_cold_temp:sensor", "value": 1.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}, {"name": "gui:water_valves", "value": 1}, {"name": "water_mantle_temp:sensor", "value": 15.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "water_hot_temp:sensor", "value": 35.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}, {"name": "water_mantle_temp:sensor", "value": 25.0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 1}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 0}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "gui:water_valves", "value": 0}, {"name": "pump_cold_water:sensor", "value": 90}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_cold_water:sensor", "value": 90}];
    console.log("testData", testData);
    updatePNID(testData);
    await sleep(1000);
}

function test()
{
    console.log(activePopups);
}

/**
 * @summary Test function for running through some of the more important functions of the PnID to validate them.
 * @description Generates a random value between 0 and 100 for every named pnid element (where "named" means an element with a value reference). This can set more elements than may actually receive state updates. Can be run in a loop by executing {@link runRandomLoop}.
 * @see runTests
 * @see runRandomLoop
 * @see stopRandomLoop
 */
function runRandom()
{
	var states = [];
	$("g.comp").each(function(index)
	{
		var state = {};
        let name = extractClasses($(this).attr("class"))[2]; //have to sanitize string first from weird whitespace
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
/**
 * @summary Sets {@link runRandom} up to run periodically with a specified interval. Repeating can be stopped with {@link stopRandomLoop}.
 * @param {number} interval The interval with which to execute {@link runRandom}.
 * @see runRandom
 * @see stopRandomLoop
 */
function runRandomLoop(interval)
{
    randInterval = setInterval(() => {
        runRandom();
    }, interval);
}

/**
 * @summary Stops {@link runRandom} from being executed periodically (after it was started with {@link runRandomLoop}).
 * @see runRandom
 * @see runRandomLoop
 */
function stopRandomLoop()
{
    clearInterval(randInterval);
}

/**
 * @summary Updates the display name of pnid elements based on the list provided.
 * @description Uses the provided state list and updates the reference to what is provided in the value field of the state list. This function only iterates through the list of states, {@link setStateName} does the actual setting.
 * @param {StateList} stateNameList The state list with the new names. Only states provided in the list will be updated.
 * @see setStateName
 */
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

/**
 * @summary Updates the display name of a pnid element based on the state provided.
 * @description Uses the provided state and updates the reference field of the state "state['name']" to what is provided in state['value']. The reference field is used for displaying the name in the header of popups as well as on the pnid itself unless the labels are hidden.
 * @param {StateList} stateNameList The state list with the new names. Only states provided in the list will be updated.
 * @see setStateNamesPNID
 */
function setStateName(state)
{
	let elementGroup = $(document).find("g." + state["name"].replaceAll(":","-"));
	if (elementGroup.length === 0)
	{
		return;
	}

	elementGroup.find("text.reference").text(state["label"]);
    updatePopupTitle(state["name"].replaceAll(":","-"), state["label"]);
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


const REFERENCE_VALUES = {
    "TargetPosition": ["sensor", "SetTargetPosition"],
    "State": "sensor",
    "Hysteresis": "SetHysteresis",
    "Enabled": "SetEnabled",
    "ActivateInternalControl": "InternalControl",
    "Abort": "Abort",
    "EndOfFlight": "EndOfFlight",
    "HolddownTimeout": "SetHolddownTimeout",
    "MinimumChamberPressure": "SetMinimumChamberPressure",
    "MinimumFuelPressure": "SetMinimumFuelPressure",
    "MinimumOxPressure": "SetMinimumOxPressure"
};

/**
 * @summary A dictionary of state links.
 * @description When two states get linked the information about this link is kept in here. The link consists of a dictionary entry of the origin state (with the state name being the identifier) which contains an array of states it is linked to.
 * @property {Object} origin The origin of a link. Key is the name of the origin state, value is an array of linked states. On a state update (via {@link updatePNID}) all states that are linked in this entry will be invoked.
 * @property {string[]} origin.statename An array of state names that is linked to another state name (the key of the object).
 * @global
 */
var __stateLinks = {};

/**
 * @summary Links one state to another.
 * @description When a state is linked to another it will be called via a state update (using {@link updatePNID}) using the same value as the invoking state. Intended to be used inside eval behavior blocks.
 * @param {string} origin The name of the state that invokes the linked state.
 * @param {string[]} statesToLink The name of the state that should be invoked on state update. Can be an array of several state names or just a single state name.
 * @param {string=all} linkType What kind of link this is - either "all" for linking value and content, "content" for only linking content or "value" for only linking value.
 * @todo consider adding an "update" function so on link time the linked state is updated to its origin so it doesn't have to wait until a new update from origin comes in to update. not really needed for us, but may still be worth to do
 * @todo consider adding a toggle/flag for preventing state updates for the linked-to state to be executed (This would completely "remove" the linked state from state updates and make it completely depend on the origin state). Not needed for our purposes as all the states we want linked don't have their own state update (which is why we need to link them) but maybe it could be useful in the future.
 * @see unlink
 */
function link(origin, statesToLink, linkType = "all")
{
    let statesArray = [];
    if (!Array.isArray(statesToLink)) //if the parameter is not an array, convert it to an array with a single element
    {
        statesArray.push(statesToLink);
    }
    else
    {
        statesArray = statesToLink;
    }

    origin = origin.replaceAll(":","-");
    for (let i in statesArray)
    {
        let state = statesArray[i].replaceAll(":","-");
        let existingLinks = __stateLinks[origin];
        if (existingLinks == undefined || existingLinks.length == 0)
        {
            existingLinks = [{child: state, linkType: linkType}];
        }
        else
        {
            let isAlreadyLinked = false;
            for (let n in existingLinks)
            {
                if (existingLinks[n]["child"] == state)
                {
                    isAlreadyLinked = true;
                    break;
                }
            }
            if (!isAlreadyLinked)
            {
                existingLinks.push({child: state, linkType: linkType});
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
 * @param {number} [updateValue] If specified sends a state update (using {@link updatePNID}) to the element that should be unlinked (even if it wasn't linked to begin with).
 * @param {boolean} [alwaysUpdate=false] Whether or not to always send the update or only when the state was actually linked before and unlinked in this run. Only has an effect if updateValue is set. Has no effect when unlinking "all" as only already linked states will be accessed anyways.
 * @see link
 */
function unlink(origin, statesToUnlink = "all", updateValue = undefined, alwaysUpdate = false)
{
    let statesArray = [];
    let unlinkUpdate = [];
    let unlinked = false;
    if (!Array.isArray(statesToUnlink))
    {
        statesArray.push(statesToUnlink);
    }
    else
    {
        statesArray = statesToUnlink;
    }
    if (statesToUnlink == "all")
    {
        statesArray = __stateLinks[origin];
        //this is not very performant and could be handled as a special case
    }

    origin = origin.replaceAll(":","-");
    for (let i in statesArray)
    {
        let state = statesArray[i].replaceAll(":","-");
        let existingLinks = __stateLinks[origin];
        if (existingLinks != undefined && existingLinks.length > 0)
        {
            let resultIndex = -1; //search for the location of the state in the existing links, -1 if not in the list.
            for (let n in existingLinks)
            {
                if (existingLinks[n]["child"] == state)
                {
                    resultIndex = n;
                    break;
                }
            }
            if (resultIndex != -1)
            {
                existingLinks.splice(resultIndex, 1); //remove item from array
                unlinked = true;
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
        if (updateValue != undefined && (alwaysUpdate || unlinked))
        {
            unlinkUpdate.push({"name": state, "value": updateValue})
        }
    }
    if (updateValue != undefined && (alwaysUpdate || unlinked))
    {
        updatePNID(unlinkUpdate);
    }
}

/**
 * @summary Finds all parents/origins from a certain link name.
 * @description Iterates through all entries in the {@link __stateLinks} dict. All entries that contain the specified child will be returned in an array.
 * @param {string} linkedChild The name of the child state is linked to one or more parents.
 * @param {boolean} isWire Indicates whether the child that the parent is searched for is a wire or not. This is needed to find possible implicitly linked wires from {@link createWireLinks} as those are stored with name "__child_wire" instead of their actual name.
 * @return {Array} List of parents found for the linked child. If the specified child is not actually linked to anything (as a child), returns an empty array.
 * @see link
 * @see unlink
 */
function findLinkParents(linkedChild, linkType = "all", isWire = false)
{
    //console.log("linked child", linkedChild, isWire);
    let parents = [];
    for (let key in __stateLinks)
    {
        //if (__stateLinks[key]["children"].includes(linkedChild))
        if (__stateLinks[key].some(e => {
            //console.log('e', e, key);
            return (e.child === linkedChild)
                && (
                    e.linkType == linkType
                    || (e.linkType == "value" && linkType == "all")
                    || (e.linkType == "all" && linkType == "value")
                    || (e.linkType == "content" && linkType == "all")
                    || (e.linkType == "all" && linkType == "content")
                );
        }))
        {
            //console.log('found parent', key);
            parents.push(key);
        }
    }
    if (isWire) // add parent of implicitly linked wires
    {
        //if (__stateLinks[linkedChild]["children"].includes("__child_wire"))
        if (__stateLinks[linkedChild] != undefined)
        {
            if (__stateLinks[linkedChild].some(e => e.child === "__child_wire"))
            {
                parents.push(linkedChild);
            }
        }
    }
    return parents;
}

/**
 * @summary Links wires and sensors with the same name.
 * @description Creates all implicit links between sensors and wires. Wires are implicitly linked to a sensor when they have the same state name. Uses {@link link} to link the states together. Adds the entry "__child_wire" into the links as a keyword for these wires to not confuse them with the parent element.
 */
function createWireLinks()
{
    let wires = $(document).find(`g.wire`); //this will probably be incredibly slow
    wires.each(function (index) {
        let wireName = wires.eq(index).attr("class").split(" ")[0];
        let parents = $(document).find(`g.${wireName}.comp`);
        if (parents.length !== 0) //it technically should only be length == 1, but having more here won't hurt I think. this just means that there's 2 elements with the same as wires (which is allowed) so on updating both of these a wire update is triggered. this leads to slightly worse performance, but it should be with few enough elements that it won't hurt that much. (Only instance I can think of with this right now is the thermalbarrier next to pressure sensors which is only once in the pnid)
        {
            link(wireName, "__child_wire");
        }
    });
}

function updateLinkedStates(state, recursionDepth = 0)
{
    //iterate through all elements linked to this one unless the current state update is only a child wire update - this brings no new data to the table
    let linkedStateUpdates = [];
    if (state["wires_only"] != true) {
        for (let linkIndex in __stateLinks[state["name"]])
        {
            if (__stateLinks[state["name"]][linkIndex]["child"] == "__child_wire") //find if the current state name has an associated child wire group
            {
                //but only initiate a child wire update if we aren't already in that child wire update (otherwise we'd get infinite recursion) - this is handled by the outermost if
                linkedStateUpdates.push({"name": state["name"] + "__child_wire", "value": state["value"], "wires_only": true});
                //wires_only is needed because normal elements take precedence over wires so if the wires need an update the normal elements need to be manually disabled for this.
                //I'm both not really happy with the wires_only implementation nor the "__child_wire" appended, but I can't think of anything better right now.
            }
            else //if we can't find a child wire entry at this index in the link list, push the linked update normally
            {
                if (state['name'] == 'pump_cold_water-sensor') {
                    //console.log('checking cold water pump links');
                }
                if (__stateLinks[state["name"]][linkIndex]["linkType"] == "all" || __stateLinks[state["name"]][linkIndex]["linkType"] == "value") //but only if the link is not set up to only link contents
                {
                    if (__stateLinks[state["name"]][linkIndex]["child"].endsWith("-wire"))
                    {
                        linkedStateUpdates.push({"name": __stateLinks[state["name"]][linkIndex]["child"], "value": state["value"], "wires_only": true});
                    }
                    else
                    {
                        linkedStateUpdates.push({"name": __stateLinks[state["name"]][linkIndex]["child"], "value": state["value"]});
                    }
                }
            }
        }
    }
    if (linkedStateUpdates.length > 0)
    {
        updatePNID(linkedStateUpdates, recursionDepth + 1);
    }
}

function setStateValue(state, recursionDepth = 0)
{
    state["name"] = state["name"].replaceAll(":","-");
    //todo: I don't want to be restricted to just numbers in the future, but for now too many places in the code expect the input to be a number
    //or at least convertible to a number.
    if (typeof state["value"] != "number")
    {
        if (!checkStringIsNumber(state["value"]))
        {
            printLog("error", "Received a state update with a value that is not a number: \"" + state["name"] + "\": \"" + state["value"] + "\". Skipping to next state update. This is intended to be supported later on");
            return;
        }
    }

    let stateType = parseStateType(state);
    let stateName = state["name"];
    switch (stateType)
    {
        case StateTypes.sensor:
            stateName = extractStateName(state["name"], StateTypes.sensor);
            handleSensorState(stateName, state["value"]);
            break;
        case StateTypes.guiEcho:
            stateName = extractStateName(state["name"], StateTypes.guiEcho);
            handleGuiEchoState(stateName, state["value"]);
            break;
        case StateTypes.actionReference:
            stateName = extractStateName(state["name"], StateTypes.actionReference);
            handleActionReferenceState(stateName, state["value"]);
            break;
        case StateTypes.setState:
            stateName = extractStateName(state["name"], StateTypes.setState);
            handleTargetState(stateName, state["value"]);
            break;
        case StateTypes.wire:
            stateName = extractStateName(state["name"], StateTypes.wire);
            handleWireState(stateName, state["value"]);
            break;
        default:
            printLog("error", `Encountered unknown state type: ${stateType.toString()}`);
            break;
    }

    updateLinkedStates(state, recursionDepth);
}

const StateTypes = Object.freeze({
	sensor: Symbol("sensor"),
	guiEcho: Symbol("guiEcho"),
	actionReference: Symbol("actionReference"),
	setState: Symbol("setState"),
    wire: Symbol("wire"),
	custom: Symbol("custom")
});

function handleSensorState(stateName, stateValue)
{
    let elementGroup = getElement(stateName);

    let unit = "";
    if (elementGroup.length != 0)
    {
        unit = findUnitFromElements(elementGroup);

        //human visible value that may contain units or further processing
        let valueElement = getElement(stateName, "value");
        valueElement.text(stateValue + unit);
        elementGroup[0].dataset.value = stateValue;
    }
    else
    {
        console.log("sensor update but actually wire update");
        //if no element was found, it could be a wire instead
        setWireState(stateName, stateValue);
        return;
    }

    let setStateValue = elementGroup[0].dataset.setState;
    const inVars = {
        "this": stateName,
        "value" : stateValue,
        "setState": setStateValue == "" ? undefined : setStateValue,
        "unit" : unit
    };

    //Return values from eval() code specified in config.json. Will be applied to PnID and cleared for every state and every loop
    elementGroup.each(function(index) {
        let elementType = getTypeFromClasses($(this).attr("class").split(" "))
        let outVars = execBehaviors(stateName, elementType, StateTypes.sensor, inVars);
        if (outVars["value"] == undefined)
        {
            outVars["value"] = stateValue + unit;
        }
        applyUpdatesToPnID(stateName, $(this), elementType, StateTypes.sensor, outVars);

        //if outVars["value"] was not set by any eval behavior block, set it to the default to be able to pass it on to updatePopup.
        //update the popup corresponding to the state name. if there is none, update popups will return without doing anything. the state name could be either for a pnid element or a popup for an action reference
        updatePopup(stateName, outVars["value"], stateValue, StateTypes.sensor);
    });

    //todo: is this code path needed on sensor updates?
    updatePopupsFromContainedStates(stateName, stateValue, StateTypes.sensor);
}

function handleGuiEchoState(stateName, stateValue)
{
    //todo: completely untested, but needs popup refactor first
    let elementGroup = getElement(stateName);

    if (elementGroup.length != 0)
    {
        elementGroup[0].dataset.guiEcho = stateValue;
        updatePopup(stateName, undefined, stateValue, StateTypes.guiEcho);
    }
    else
    {
        //if we can't find a corresponding state directly, it may be a variable just contained in a popup
        for (let i in activePopups)
        {
            for (let n in activePopups[i]["containedStates"])
            {
                if (activePopups[i]["containedStates"][n] == stateName)
                {
                    //console.log("trying to update contained state", state["name"], isGuiState, isActionReference, i);
                    updatePopup(stateName, undefined, stateValue, StateTypes.guiEcho, i);
                }
            }
        }
    }
}

function handleActionReferenceState(stateName, stateValue)
{
    //console.log("action reference state", state);
    let elementGroup = getElement(stateName);

    let unit = "";
    if (elementGroup.length != 0)
    {
        //todo: do I even still need the actual DOM element of the action reference value?
        //it's not used everywhere I think, but not 100% sure
        let actionRefValueElement = getElement(stateName, "actionReferenceValue");
        actionRefValueElement.text(stateValue);
        elementGroup.each(function (index) {
            elementGroup[index].dataset.actionReferenceValue = stateValue;
        });
        unit = findUnitFromElements(elementGroup);
    }
    
    const inVars = {
        "this": stateName,
        "value" : stateValue,
        "unit" : unit
    };

    //Return values from eval() code specified in config.json. Will be applied to PnID and cleared for every state and every loop
    elementGroup.each(function(index) {
        let elementType = getTypeFromClasses($(this).attr("class").split(" "))
        let outVars = execBehaviors(stateName, stateName, StateTypes.actionReference, inVars);
        //state name twice in exec behaviors so it searches in both default and custom config for action reference config
        if (outVars["value"] == undefined)
        {
            outVars["value"] = stateValue + unit;
        }
        applyUpdatesToPnID(stateName, $(this), elementType, StateTypes.actionReference, outVars);

        //if outVars["value"] was not set by any eval behavior block, set it to the default to be able to pass it on to updatePopup.
        //update the popup corresponding to the state name. if there is none, update popups will return without doing anything. the state name could be either for a pnid element or a popup for an action reference
        updatePopup(stateName, outVars["value"], stateValue, StateTypes.actionReference);
    });

    updatePopupsFromContainedStates(stateName, stateValue, StateTypes.actionReference);
}

function handleTargetState(stateName, stateValue)
{
    let elementGroup = getElement(stateName);

    if (elementGroup.length != 0)
    {
        elementGroup.each(function (index) {
            elementGroup[index].dataset.setState = stateValue;
        });
    }
}

function handleWireState(stateName, stateValue)
{
    let elementGroup = getElement(stateName, "wire");

    const inVars = {
        "this": stateName,
        "value" : stateValue
    };

    //Return values from eval() code specified in config.json. Will be applied to PnID and cleared for every state and every loop
    elementGroup.each(function(index) {
        let outVars = execBehaviors(stateName, "wire", StateTypes.wire, inVars);
        applyUpdatesToPnID(stateName, $(this), "wire", StateTypes.wire, outVars);
    });
}

function execBehaviors(stateName, elementType, stateType, inVars)
{
    let outVars = { };

    //the accuracy of the sensor in question. needed for determining whether the feedback value is acceptably close to the set point.
    let sensorDeviationCheck = "return !(feedback == setState);";

    //search for the search term in the default config and run the eval behavior code and run special update tank content function (if applicable)
    //console.log("search term", searchTerm);
    //console.log("true search term", searchTerm.replace("_Slim", "").replace("_Short", ""));
    let defaultSensorDeviation = getConfigData(defaultConfig, elementType.replace("_Slim", "").replace("_Short", ""), "sens_deviation");
    if (defaultSensorDeviation !== undefined)
    {
        sensorDeviationCheck = defaultSensorDeviation;
    }

    let evalCode = getConfigData(defaultConfig, elementType.replace("_Slim", "").replace("_Short", ""), "eval");
    //console.log("eval", evalCode);
    if (evalCode != undefined)
    {
        eval(evalCode);
        //console.log("search term", searchTerm);
    }

    //traverse custom JSON to find all evals applicable to current element. evals later in JSON overwrite changes made by evals earlier (if they change the same parameters)
    let stateConfigName = stateName;
    if (stateType == StateTypes.wire)
    {
        stateConfigName = stateConfigName.replace("-sensor", ":sensor:wire"); //TODO this could lead to issues if there is a "-sensor" string in the middle, not the end of the string. doesn't occur with our naming scheme, but who's to say this won't change in the future
        //console.log("updated config search name for wire", stateConfigName.replace("-", ":"));
    }
    let customSensorDeviation = getConfigData(config, stateConfigName.replaceAll("-", ":").replace("_Slim", "").replace("_Short", ""), "sens_deviation");
    if (customSensorDeviation !== undefined)
    {
        sensorDeviationCheck = customSensorDeviation;
    }

    let customEvalCode = getConfigData(config, stateConfigName.replaceAll("-", ":").replace("_Slim", "").replace("_Short", ""), "eval");
    if (customEvalCode != undefined)
    {
        eval(customEvalCode);
    }

    if ((inVars["setState"] != undefined || inVars["setState"] != null) && stateType == StateTypes.sensor && sensorDeviationCheck != null)
    {
        eval(`var sensDevChecker = function (feedback, setState) { ${sensorDeviationCheck} }`);
        //console.log('sens deviation function:', `var sensDevChecker = function (feedback, setState) { ${sensorDeviationCheck} }`);
        if (sensDevChecker(inVars["value"], parseFloat(inVars["setState"])))
        {
            //console.log("feedback deviation error");
            outVars["color"] = "feedback_deviation_error";
        }
    }
    return outVars;
}

/**
 * @summary Sets the value of one pnid element based on a state update.
 * @description Takes the provided state update, searches all pnid elements directly affected by it and updates them. Updating means setting the internal values, as well as loading the behavior blocks from the configs and executing them to allow for proper element formatting. Also traverses through elements linked via {@link link} and updates them accordingly.
 * @param {State} state The state update that should be processed.
 * @param {number} [recursionDepth=0] Internal parameter indicating recursion depth. Only as a safety precaution against infinite recursion that can happen with badly configured links in the config. Check to break at a too high recursion depth happens in {@link updatePNID}.
 * @see updatePNID
 * @example setStateValue({"name": "a_cool_state_name", "value": 123.0});
 */
function setStateValueNumber(state, recursionDepth = 0)
{
    let stateType = parseStateType(state);
    let stateName = extractStateName(state["name"]);

    let isActionReference = false;
    let isWire = undefined;
    let elementGroup = []; //I'd rather have "undefined" here, but the check later with .length would fail if I did that.
    if (state["wires_only"] == true) //remove the "__child_wire" postfix if it's a wires only update. TODO I dislike that "wires_only" is synonymous with "child wires", but for now it's only used that way so I'll live with it.
    {
        //console.log("state name", state["name"]);
        stateName = state["name"].replace("__child_wire", ""); //technically doesn't need to be inside this if as I'm already assuming in other places in the code that in normal use there's never "__child_wire" contained in the state name.
        //console.log("state name 2", state["name"]);
    }
    else
    {
        //only search for elements if it's not a wire, searching for wires comes later anyways, don't need redundancy. this "2 stage" approach is because we may not always know at
        //this point if we'll have to update wires - if we do know we can skip some unneeded function calls though
        elementGroup = getElement(stateName);
    }

	// check if any pnid element is found with the provided state name
	let unit = "";
	if (elementGroup.length !== 0 && !state["wires_only"]) // if an element is found and...
	{
        if (stateType == StateTypes.guiEcho || stateType == StateTypes.setState) // ...and incoming state is not a GUI state, update it.
        {
            elementGroup[0].dataset.setState = state["value"];
        }
        else if (stateType == StateTypes.actionReference)
        {
            let actionRefValueElement = getElement(stateName, "actionReferenceValue");
            actionRefValueElement.text(state["value"]);
            elementGroup[0].dataset.actionReferenceValue = state["value"];
        }
        else if (stateType == StateTypes.sensor)
        {
            unit = elementGroup.not("g.PnID-ThermalBarrier").not("g.PnID-HeatExchanger").dataset.unit; //exclude thermalbarrier from unit search (only the corresponding pressure sensor has a unit set)
            //TODO I dislike that this is hardcoded, but don't know how else to do that

            //human visible value that may contain units or further processing
            let valueElement = getElement(state["name"], "value");
            valueElement.text(state["value"] + unit);
            elementGroup[0].dataset.value = state["value"];
        }
	}
	else // if no element was found check if the element in question may be a wire instead
    {
        stateType = StateTypes.wire;
        elementGroup = getElement(state["name"], "wire");
    }
	
	if (elementGroup.length !== 0)
    {
        //----- prepare for eval behavior block
        //In Variables for the eval() code specified in config.json. Will be reset/overwritten for every state and every loop
        let setStateValue = elementGroup[0].dataset.setState;
        const inVars = {
            "this": state["name"],
            "value" : state["value"],
            "setState": setStateValue == "" ? undefined : setStateValue,
            "unit" : unit
        };

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
            //the accuracy of the sensor in question. needed for determining whether the feedback value is acceptably close to the set point.
            let sensorDeviationCheck = "return !(feedback == setState);";
            //iterate through search terms (classes for elements, action references for... action references) within one element
            for (let index in configSearchTerms[i]) //search through attributes to find class attribute related to type (eg: PnID-Valve_Manual)
            {
                let searchTerm = configSearchTerms[i][index];
                if (isWire)
                {
                    searchTerm = "wire";
                }
                else if (configSearchTerms[i].includes("PnID-ThermalBarrier"))
                {
                    searchTerm = "PnID-Sensor_Pressure"; //should this really be hardcoded? is there a reason for it to have to be dynamic? evaluate
                }

                //search for the search term in the default config and run the eval behavior code and run special update tank content function (if applicable)
                //console.log("search term", searchTerm);
                //console.log("true search term", searchTerm.replace("_Slim", "").replace("_Short", ""));
                let defaultSensorDeviation = getConfigData(defaultConfig, searchTerm.replace("_Slim", "").replace("_Short", ""), "sens_deviation");
                if (defaultSensorDeviation !== undefined)
                {
                    sensorDeviationCheck = defaultSensorDeviation;
                }

                let evalCode = getConfigData(defaultConfig, searchTerm.replace("_Slim", "").replace("_Short", ""), "eval");
                //console.log("eval", evalCode);
                if (evalCode != undefined)
                {
                    eval(evalCode);
                    //console.log("search term", searchTerm);
                    break; //don't need to iterate further, we already found the config
                }
            }

            //traverse custom JSON to find all evals applicable to current element. evals later in JSON overwrite changes made by evals earlier (if they change the same parameters)
            let stateConfigName = state["name"];
            if (isWire)
            {
                stateConfigName = stateConfigName.replace("-sensor", ":sensor:wire"); //TODO this could lead to issues if there is a "-sensor" string in the middle, not the end of the string. doesn't occur with our naming scheme, but who's to say this won't change in the future
                //console.log("updated config search name for wire", stateConfigName.replace("-", ":"));
            }
            let customSensorDeviation = getConfigData(config, stateConfigName.replaceAll("-", ":").replace("_Slim", "").replace("_Short", ""), "sens_deviation");
            if (customSensorDeviation !== undefined)
            {
                sensorDeviation = customSensorDeviation;
            }

            let customEvalCode = getConfigData(config, stateConfigName.replaceAll("-", ":").replace("_Slim", "").replace("_Short", ""), "eval");
            if (customEvalCode != undefined)
            {
                eval(customEvalCode);
            }

            //only update the pnid if it's not a GUI state (we only want sensor feedback to update the pnid, not setpoint)
            if (!isGuiState)
            {
                //if the set state is defined (it is an element that even has a set state) and it's not an action reference try checking for set vs feedback value deviation
                if ((inVars["setState"] != undefined || inVars["setState"] != null) && !isActionReference && sensorDeviationCheck != null && !isWire)
                {
                    //console.log("checking for set state deviation");
                    //if the set state is outside of the actual feedback state +/- the set deviation color the element as error
                    eval(`var sensDevChecker = function (feedback, setState) { ${sensorDeviationCheck} }`);
                    //console.log('sens deviation function:', `var sensDevChecker = function (feedback, setState) { ${sensorDeviationCheck} }`);
                    if (sensDevChecker(state["value"], parseFloat(inVars["setState"])))
                    {
                        //console.log("feedback deviation error");
                        outVars["color"] = "feedback_deviation_error";
                    }
                    /*if (inVars["setState"] < state["value"] - state["value"] * sensorDeviation || inVars["setState"] > state["value"] + state["value"] * sensorDeviation)
                    {
                        console.log("feedback deviation error");
                        outVars["color"] = "feedback_deviation_error";
                    }*/
                }
                
                applyUpdatesToPnID(elementGroup.eq(i), outVars, isActionReference);
                //TODO this part is kinda weird - I don't understand why in case of action references
                //it actually updates all elements. but it does. so whatever I guess?
            }
            else
            {
                //todo add handling for set vs feedback value deviation check here as well (if the set state update it should also be able to detect error)
                //but: is this even wanted? this means that no matter what happens there will always be a short flash of the error state as the feedback value
                //is always a bit delayed
            }
            
        }
        //if outVars["value"] was not set by any eval behavior block, set it to the default to be able to pass it on to updatePopup.
        if (outVars["value"] == undefined)
        {
            outVars["value"] = state["value"] + unit;
        }
        //update the popup corresponding to the state name. if there is none, update popups will return without doing anything. the state name could be either for a pnid element or a popup for an action reference
        updatePopup(state["name"], outVars["value"], state["value"], isGuiState, isActionReference);
    }
    else
    {
        for (let i in activePopups)
        {
            for (let n in activePopups[i]["containedStates"])
            {
                if (activePopups[i]["containedStates"][n] == state["name"])
                {
                    //console.log("trying to update contained state", state["name"], isGuiState, isActionReference, i);
                    updatePopup(state["name"], undefined, state["value"], isGuiState, isActionReference, i);
                }
            }
        }
        //printLog("warning", `Received state update with no corresponding pnid element, wire or action reference! State: <code>${state["name"]}</code>: <code>${state["value"]}</code>`);
        //this warning is super spammy and kind of doesn't make sense - this is "intended" behavior as soon as we start splitting one system into several PnIDs.
        //probably worth removing altogether, but evaluate first.
    }

    //iterate through all elements linked to this one unless the current state update is only a child wire update - this brings no new data to the table
    let linkedStateUpdates = [];
    if (state["wires_only"] == false || state["wires_only"] == undefined) {
        for (let linkIndex in __stateLinks[state["name"]])
        {
            if (__stateLinks[state["name"]][linkIndex]["child"] == "__child_wire") //find if the current state name has an associated child wire group
            {
                //but only initiate a child wire update if we aren't already in that child wire update (otherwise we'd get infinite recursion) - this is handled by the outermost if
                linkedStateUpdates.push({"name": state["name"] + "__child_wire", "value": state["value"], "wires_only": true});
                //wires_only is needed because normal elements take precedence over wires so if the wires need an update the normal elements need to be manually disabled for this.
                //I'm both not really happy with the wires_only implementation nor the "__child_wire" appended, but I can't think of anything better right now.
            }
            else //if we can't find a child wire entry at this index in the link list, push the linked update normally
            {
                if (state['name'] == 'pump_cold_water-sensor') {
                    //console.log('checking cold water pump links');
                }
                if (__stateLinks[state["name"]][linkIndex]["linkType"] == "all" || __stateLinks[state["name"]][linkIndex]["linkType"] == "value") //but only if the link is not set up to only link contents
                {
                    if (__stateLinks[state["name"]][linkIndex]["child"].endsWith("-wire"))
                    {
                        linkedStateUpdates.push({"name": __stateLinks[state["name"]][linkIndex]["child"], "value": state["value"], "wires_only": true});
                    }
                    else
                    {
                        linkedStateUpdates.push({"name": __stateLinks[state["name"]][linkIndex]["child"], "value": state["value"]});
                    }
                }
            }
        }
    }
    if (linkedStateUpdates.length > 0)
    {
        updatePNID(linkedStateUpdates, recursionDepth + 1);
    }
}

//TODO update to use element name instead of element group now that getElement properly caches stuff (haha) it's more efficient and better readable
function applyUpdatesToPnID(stateName, element, elementType, stateType, outVars)
{	
    if (elementType == "wire")
    {
        elementType = "pnid-wire";
        //todo: translation here because we need to access the data-pnid-wire dataset and I don't want to have to remember this every time I run this function
    }
	//apply all outVars to PnID
	if ("color" in outVars && stateType != StateTypes.actionReferencec)
	{
        let color = outVars["color"];
        if (color == "content") //if the color is "content" figure out what content is actually there and enter this.
        {
            //console.log("trying to enter content", elementGroup, elementName);
            let ownContent = getElementAttrValue(stateName, "data-content");
            if (ownContent == undefined || ownContent == "") //if the own content attribute is not set/undefined, backtrace links to parents and find their content attribute
            {
                //console.log("did not find own content", elementGroup);
                let parents = findLinkParents(stateName, "content", stateType == StateTypes.wire);
                //console.log("parents", parents);
                let parentContent = traverseParentsToContent(stateName, stateType == StateTypes.wire);
                if (parentContent != undefined)
                {
                    color = parentContent;
                }
            }
            else
            {
                //console.log("found own content", elementGroup);
                color = ownContent;
            }
        }
        element[0].dataset[dashToCamel(elementType)] = color; //todo: check if that way of accessing the dataset is correct
	}
	if ("value" in outVars)
	{
        //todo: is the extra field still needed?
        if (stateType == StateTypes.actionReference)
        {
            element.find("text.actionReferenceValue").text(outVars["value"]);
        }
        else
        {
            element.find("text.value").text(outVars["value"]);
        }
	}
    if ("content" in outVars)
    {
        element.attr("data-content", outVars["content"]);
    }
    //todo this isn't properly scalable to other components that'd need percentage outputs
    //we just assume that everything that has a percentage output is a tank
    if ("percent" in outVars)
    {
        updateTankContent(element, outVars['percent']);
    }
	if ("crossUpdate" in outVars)
	{
		updatePNID(outVars["crossUpdate"]);
	}
}

/**
 * @summary Follows the chain of parents to find either the highest one or the one that has its own content set and not another content link set up.
 * @description Takes the first parent of the element in question and moves up the chain of parents. In case of multiple parents, the first one is used for simplicity's sake
 * (Could break behavior in case no content is found in one path but would be found in another - this would need a proper tree traversal but considering multiple parents isn't
 * actually *properly* supported or useful in the current version I'll just leave it be for now).
 * May break when a child_wire is linked to a child_wire. Not sure if it really does and I don't care to test because it's stupid. If you wanna link one child_wire to another, just link it directly to the common parent. 
 * @param {Object} elementName The first order parent of the element in question.
 */
function traverseParentsToContent(elementName, isWire = false, recursionDepth = 0)
{
    if (recursionDepth >= 5)
    {
        return undefined;
    }

    let parents = findLinkParents(elementName, "content", isWire);
    let parentContent = getElementAttrValue(parents[0], "data-content");
    let recContent = traverseParentsToContent(parents[0], false, recursionDepth + 1);

    if (recContent != undefined)
    {
        return recContent;
    }
    return parentContent;
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
