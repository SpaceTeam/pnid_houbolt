//todo: evaluate if default configs may benefit from having a state *blacklist* instead of a state *whitelist* like in the custom configs
let defaultConfig = {};
$.get('/config/default', function(data) {
    //console.log("default");
    //console.log("default:", data);
    defaultConfig = data;
});

let config = {};
$.get('/config/custom', function(data) {
    //console.log("custom:", data);
    config = data;
});

let thresholds = {};
$.get('/config/thresholds', function(data) {
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

//update the percent of the content that is filled
/**
 * @summary Updates tank fill level to a specified percentage.
 * @description Sets the fill level of the specified tank to the specified percentage using transform: scale(). Needs the tanks to be initialized prior with {@link initTanks}
 * @param {jQuery} tank The jQuery DOM element of the tank that should be updated.
 * @param {number} fillPercent The (floating point) percentage (0-100, not 0-1)
 */
function updateTankContent(tank, fillPercent)
{
    let contentRect = tank.find("g").find("rect.rect");
    //console.log("content rect", contentRect);
    let scale = fillPercent / 100.0;
    contentRect.attr("transform", `scale(1,${scale})`);
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
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 93.0}, {"name": "water_hot_temp:sensor", "value": 30.0}, {"name": "water_cold_temp:sensor", "value": 1.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}, {"name": "water_valves_out:sensor", "value": 10.0}, {"name": "water_valves_in:sensor", "value": 90.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "water_hot_temp:sensor", "value": 35.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 95.0}, {"name": "water_mantle_temp:sensor", "value": 25.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_hot_water:sensor", "value": 2}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "water_valves_out:sensor", "value": 90.0}, {"name": "pump_cold_water:sensor", "value": 90}, {"name": "water_valves_in:sensor", "value": 10.0}];
    updatePNID(testData);
    await sleep(1000);
    var testData = [{"name": "pump_cold_water:sensor", "value": 90}];
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
 * @description Takes the {@link StateList}, iterates through every state and updates the corresponding PnID elements with the new state values by passing each state to {@link setStateValue}.
 * @param {StateList} stateList The list of states that should be updated.
 * @param {number} [recursionDepth=0] Internal parameter indicating recursion depth. Only as a safety precaution against infinite recursion that can happen with badly configured links in the config.
 * @see setStateValue
 * @todo I could add a parent name list and append each step for deeper recursions. this way I can check through each step of the recursion and see if the current name has already been executed once and skip it (and give a better trace if the recursion gets too long)
 * @example updatePNID([{"name": "a_cool_state_name", "value": 123.4}]);
 */
function updatePNID(stateList, recursionDepth = 0)
{
    if (recursionDepth >= 5)
    {
        printLog("warning", `Reached a recursion depth of 5 while updating the PnID. This is likely due to misconfigured links in the configuration files. Aborting. Last state list was <code>${JSON.stringify(stateList)}</code>.`);
        return;
    }
	//printLog("info", "Updating PnID with: " + stateList);

    logStates(stateList);
	
	for (stateIndex in stateList)
	{
		//let stateName = stateList[stateIndex]["name"];
		//let stateValue = stateList[stateIndex]["value"];
		//printLog("info", "updating pnid for state name: '" + stateName + "' value: " + stateValue);
        //if (stateList[stateIndex] != parentState) //if the last element in the recursion was named the same as the current element, don't execute setStateValue, as we'd get infinite recursions otherwise. I'm really not happy with this implementation.
        //{
            setStateValue(stateList[stateIndex], recursionDepth);
        //}
	}
	
	//$('.' + stateList[0].name).eval(config[stateName]["eval"])
}

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
 * @param {boolean} onlyLinkContents Whether or not to only link the contents and not the state value updates. Setting to true does not pass state updates on from origin to child states, false (default) links fully.
 * @todo consider adding an "update" function so on link time the linked state is updated to its origin so it doesn't have to wait until a new update from origin comes in to update. not really needed for us, but may still be worth to do
 * @todo consider adding a toggle/flag for preventing state updates for the linked-to state to be executed (This would completely "remove" the linked state from state updates and make it completely depend on the origin state). Not needed for our purposes as all the states we want linked don't have their own state update (which is why we need to link them) but maybe it could be useful in the future.
 * @see unlink
 */
function link(origin, statesToLink, onlyLinkContents = false)
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
            existingLinks = [{child: state, onlyLinkContent: onlyLinkContents}];
        }
        else
        {
            if (!existingLinks.includes(state))
            {
                existingLinks.push({child: state, onlyLinkContent: onlyLinkContents});
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
    origin = origin.replace(":","-");
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
function findLinkParents(linkedChild, isWire = false)
{
    //console.log("linked child", linkedChild, isWire);
    let parents = [];
    for (let key in __stateLinks)
    {
        //if (__stateLinks[key]["children"].includes(linkedChild))
        if (__stateLinks[key].some(e => e.child === linkedChild))
        {
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

/**
 * @summary Sets the value of one pnid element based on a state update.
 * @description Takes the provided state update, searches all pnid elements directly affected by it and updates them. Updating means setting the internal values, as well as loading the behavior blocks from the configs and executing them to allow for proper element formatting. Also traverses through elements linked via {@link link} and updates them accordingly.
 * @param {State} state The state update that should be processed.
 * @param {number} [recursionDepth=0] Internal parameter indicating recursion depth. Only as a safety precaution against infinite recursion that can happen with badly configured links in the config. Check to break at a too high recursion depth happens in {@link updatePNID}.
 * @see updatePNID
 * @example setStateValue({"name": "a_cool_state_name", "value": 123.0});
 */
function setStateValue(state, recursionDepth = 0)
{
    //console.log("state:", state);
    if (typeof state["value"] != "number")
    {
        if (!checkStringIsNumber(state["value"]))
        {
            printLog("error", "Received a state update with a value that is not a number: \"" + state["name"] + "\": \"" + state["value"] + "\". Skipping to next state update.");
            return;
        }
    }
    
    state["name"] = state["name"].replaceAll(":","-");
    if (typeof state["value"] != "string")
    {
        state["value"] = Math.round((state["value"] + Number.EPSILON) * 100) / 100;
    }

    //if a state starts with "gui:" it's a Get/SetState state, in the sense of a set point as opposed to a feedback/sensor value
    //these states should only be used to update input elements in popups, nothing else, as the rest of the pnid should be feedback value based.
    let isGuiState = false;
    if (state["name"].startsWith("gui-"))
    {
        //console.log("found gui state", state["name"], "with value", state["value"]);
        isGuiState = true;
        state["name"] = state["name"].replace("gui-", "");
    }
    
    let isActionReference = false;
    let isWire = undefined;
    let elementGroup = []; //I'd rather have "undefined" here, but the check later with .length would fail if I did that.
    if (state["wires_only"] == true) //remove the "__child_wire" postfix if it's a wires only update. TODO I dislike that "wires_only" is synonymous with "child wires", but for now it's only used that way so I'll live with it.
    {
        //console.log("state name", state["name"]);
        state["name"] = state["name"].replace("__child_wire", ""); //technically doesn't need to be inside this if as I'm already assuming in other places in the code that in normal use there's never "__child_wire" contained in the state name.
        //console.log("state name 2", state["name"]);
    }
    else
    {
        //only search for elements if it's not a wire, searching for wires comes later anyways, don't need redundancy. this "2 stage" approach is because we may not always know at
        //this point if we'll have to update wires - if we do know we can skip some unneeded function calls though
        isActionReference = getIsActionReference("gui-" + state["name"]);
        if (isActionReference)
        {
            state["name"] = "gui-" + state["name"]; //I hate that I have to prepend "gui-" here again after removing it before. TODO clean this up
            isGuiState = false; //is it though? action reference are set as gui states and I probably should unify them
        }
        elementGroup = getElement(state["name"]);
    }

	// check if any pnid element is found with the provided state name
	let unit = "";
	if (elementGroup.length !== 0 && !state["wires_only"]) // if an element is found and...
	{
        if (!isGuiState) // ...and incoming state is not a GUI state, update it.
        {
            if (isActionReference)
            {
                let actionRefValueRawElement = getElement(state["name"], "actionReferenceValueRaw");
                let actionRefValueElement = getElement(state["name"], "actionReferenceValue");
                actionRefValueRawElement.text(state["value"]);
                actionRefValueElement.text(state["value"]);
            }
            else
            {
                unit = elementGroup.not("g.PnID-ThermalBarrier").attr("data-unit"); //exclude thermalbarrier from unit search (only the corresponding pressure sensor has a unit set)
                //TODO I dislike that this is hardcoded, but don't know how else to do that

                //raw value without any processing
                let valueRawElement = getElement(state["name"], "valueRaw");
                //human visible value that may contain units or further processing
                let valueElement = getElement(state["name"], "value");
                valueRawElement.text(state["value"]);
                valueElement.text(state["value"] + unit);
            }
        }
        else //if it *is* a gui state, store the gui state value
        {
            let setStateElement = getElement(state["name"], "setState");
            setStateElement.text(state["value"]);
        }
        
	}
	else // if no element was found check if the element in question may be a wire instead
    {
        isWire = true;
        elementGroup = getElement(state["name"], "wire");
    }
	
	if (elementGroup.length !== 0)
    {
        //----- prepare for eval behavior block
        //In Variables for the eval() code specified in config.json. Will be reset/overwritten for every state and every loop
        const inVars = {
            "this": state["name"],
            "value" : state["value"],
            "setState": getElementValue(state["name"], "setState"),
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
                let evalCode = getConfigData(defaultConfig, searchTerm.replace("_Slim", "").replace("_Short", ""), "eval");
                //console.log("eval", evalCode);
                if (evalCode != undefined)
                {
                    eval(evalCode);
                    //console.log("search term", searchTerm);
                    if (searchTerm.replace("_Slim", "") === "PnID-Tank" && !isGuiState) //TODO this only triggers if the tank has an eval set (even if empty) - is that desired behavior?
                    {
                        updateTankContent(elementGroup, state["value"]);
                    }
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
            let customEvalCode = getConfigData(config, stateConfigName.replace("-", ":").replace("_Slim", ""), "eval");
            if (customEvalCode != undefined)
            {
                eval(customEvalCode);
            }

            //only update the pnid if it's not a GUI state (we only want sensor feedback to update the pnid, not setpoint)
            if (!isGuiState)
            {
                applyUpdatesToPnID(elementGroup.eq(i), outVars, isActionReference);
                //TODO this part is kinda weird - I don't understand why in case of action references
                //it actually updates all elements. but it does. so whatever I guess?
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
        //printLog("warning", `Received state update with no corresponding pnid element, wire or action reference! State: <code>${state["name"]}</code>: <code>${state["value"]}</code>`);
        //this warning is super spammy and kind of doesn't make sense - this is "intended" behavior as soon as we start splitting one system into several PnIDs.
        //probably worth removing altogether, but evaluate first.
    }

    //iterate through all elements linked to this one
    let linkedStateUpdates = [];
    for (let linkIndex in __stateLinks[state["name"]])
    {
        if (__stateLinks[state["name"]][linkIndex]["child"] == "__child_wire") //find if the current state name has an associated child wire group
        {
            if (state["wires_only"] == false || state["wires_only"] == undefined) //but only initiate a child wire update if we aren't already in that child wire update (otherwise we'd get infinite recursion)
            {
                linkedStateUpdates.push({"name": state["name"] + "__child_wire", "value": state["value"], "wires_only": true});
                //wires_only is needed because normal elements take precedence over wires so if the wires need an update the normal elements need to be manually disabled for this.
                //I'm both not really happy with the wires_only implementation nor the "__child_wire" appended, but I can't think of anything better right now.

            }
        }
        else //if we can't find a child wire entry at this index in the link list, push the linked update normally
        {
            if (__stateLinks[state["name"]][linkIndex]["onlyLinkContent"] == false) //but only if the link is not set up to only link contents
            {
                if (__stateLinks[state["name"]][linkIndex]["child"].endsWith(":wire"))
                {
                    if (__stateLinks[state["name"]][linkIndex]["child"] == "heat_exchanger_in:wire")
                    {
                        console.log("heat_exchanger_in", state["value"]);
                    }
                    linkedStateUpdates.push({"name": __stateLinks[state["name"]][linkIndex]["child"], "value": state["value"], "wires_only": true});
                }
                else
                {
                    linkedStateUpdates.push({"name": __stateLinks[state["name"]][linkIndex]["child"], "value": state["value"]});
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
function applyUpdatesToPnID(elementGroup, outVars, isActionReference)
{
    let elementName = undefined;
    let classes = elementGroup.attr("class").split(" ");
    let isWire = false;
    if (classes.includes("wire"))
    {
        isWire = true;
        elementName = classes[0];
    }
    else
    {
        elementName = getValReferenceFromClasses(classes);
    }
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
                let color = outVars["color"];
                if (color == "content") //if the color is "content" figure out what content is actually there and enter this.
                {
                    //console.log("trying to enter content", elementGroup, elementName);
                    let ownContent = undefined;
                    if (!isWire)
                    {
                        //console.log("not a wire so trying to find own content");
                        ownContent = getElementAttrValue(elementName, "data-content");
                    }
                    if (ownContent == undefined || ownContent == "") //if the own content attribute is not set/undefined, backtrace links to parents and find their content attribute
                    {
                        //console.log("did not find own content", elementGroup);
                        let parents = findLinkParents(elementName, isWire);
                        //console.log("parents", parents);
                        let parentContent = traverseParentsToContent(elementName, isWire);
                        /*for (let i in parents)
                        {
                            let parentContent = getElementAttrValue(parents[i], "data-content");
                            if (parentContent != undefined) //use first parent content that is found
                            {
                                //console.log("found parent with content", elementGroup, parents[i]);
                                color = parentContent;
                            }
                        }*/
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
				elementGroup.attr(attribute.name, color);
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
    if ("content" in outVars)
    {
        elementGroup.attr("data-content", outVars["content"]);
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

    let parents = findLinkParents(elementName, isWire);
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
