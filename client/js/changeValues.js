//todo: evaluate if default configs may benefit from having a state *blacklist* instead of a state *whitelist* like in the custom configs
let defaultConfig = {};

$.get('/config/default', function(data) {
    defaultConfig = data;
});

let config = {};

$.get('/config/custom', function(data) {
    config = data;
});

let thresholds = {};

$.get('/config/thresholds', function(data) {
    thresholds = data;
});

createLogBox();

function checkStringIsNumber(string)
{
    if (typeof string == "string")
    {
        let re = /(^\d+$)|(^\d+\.\d*$)|(^\d*\.\d+$)/; //checks for either integer with only digits which are at beginning and end (one continuous string of digits) or 
                                                      //checks for float with either 1 or more digits followed by decimal point followed by 0 or more digits (3. or 3.04, but not .2), or
                                                      //0 or more digits followed by decimal point followed by 1 or more digits (.3 or 1.345, but not 2.)
        if (!re.test(string))
        {
            return false;
        }
    }
    else
    {
        printLog("warning", "Tried checking if a string is a number, but didn't receive a string: " + string);
        return false;
    }
    return true;
}

//setup tanks for filling visuals
function tankSetup()
{
    let tanks = $(document).find("g.PnID-Tank");
    let fuelPaths = tanks.filter(".Fuel").find("path[d*=' A ']");
    let oxPaths = tanks.filter(".Oxidizer").find("path[d*=' A ']");
    fuelPaths.attr(`data-pnid-tank_content`, `fuel`);
    oxPaths.attr(`data-pnid-tank_content`, `ox`);
    initTankContent(tanks);
}

function initTankContent(tanks)
{
    let fuelPaths = extractArcPathsFromTank(tanks.filter(".Fuel"));
    let oxPaths = extractArcPathsFromTank(tanks.filter(".Oxidizer"));

    let fuelContentRect = tanks.filter(".Fuel").find("rect.rect");
    let fuelTransformOriginY = +fuelContentRect.attr("y") + +fuelContentRect.attr("height");
    fuelContentRect.attr("data-pnid-tank_content", "fuel");
    fuelContentRect.attr("transform-origin", `center ${fuelTransformOriginY}`);
    fuelContentRect.attr("transform", "scale(1,0)");

    let oxContentRect = tanks.filter(".Oxidizer").find("rect.rect");
    let oxTransformOriginY = +oxContentRect.attr("y") + +oxContentRect.attr("height");
    oxContentRect.attr("data-pnid-tank_content", "ox");
    oxContentRect.attr("transform-origin", `center ${oxTransformOriginY}`);
    oxContentRect.attr("transform", "scale(1,0)");
}

//update the percent of the content that is filled
function updateTankContent(tank, fillPercent)
{
    let contentRect = tank.find("rect.rect");
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
	var testNames = [{"name": "fuel_top_tank_temp", "label": "hope so"}, {"name": "ox_pressurant_press_pressure", "label": "adf"}];
	setStateNamesPNID(testNames);
	var testData = [{"name": "purge_regulator_pressure", "value": 95.0}, {"name": "Fuel", "value": 95.0}, {"name": "fuel_top_tank_temp", "value": 27}, {"name": "purge_solenoid", "value": 1.0}, {"name": "ox_pressurant_press_pressure", "value": 30.0}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "oxfill_vent_valve", "value": 10}, {"name": "fuel_bottom_tank_temp", "value": 101}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "fuel_depressurize_solenoid", "value": 12.0}, {"name": "oxfill_vent_valve", "value": 50}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "purge_solenoid", "value": 6.0}, {"name": "fuel_pressurize_solenoid", "value": 20.0}, {"name": "oxfill_vent_valve", "value": 80}, {"name": "ox_top_temp", "value": 22}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "Fuel", "value": 50.0}, {"name": "purge_regulator_pressure", "value": 1.5}, {"name": "Oxidizer", "value": 30.0}, {"name": "ox_mid_temp", "value": 5}, {"name": "ox_bottom_temp_backup", "value": -2}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "ox_top_tank_pressure", "value": 32.0}, {"name": "Fuel", "value": 5.0}, {"name": "ox_bottom_temp", "value": -4}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "ox_bottom_tank_pressure", "value": 32.0}, {"name": "purge_solenoid", "value": 0.0}, {"name": "ox_top_tank_pressure", "value": 0.5}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "ox_bottom_tank_pressure", "value": 0.0}, {"name": "chamber_pressure", "value": 40}, {"name": "ox_depressurize_solenoid", "value": 20.0}];
	updatePNID(testData);
	await sleep(500);
	var testData = [{"name": "fuel_pressurize_solenoid", "value": 5.0}, {"name": "fuel_depressurize_solenoid", "value": 1.0}];
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
	let elementGroup = $(document).find("g." + state["name"]);
	if (elementGroup.length === 0)
	{
		return;
	}

	elementGroup.find("text.reference").text(state["label"]);
}

function getElementValue(name, rawValue)
{
    let searchString = "text.value";
    if (rawValue === true)
    {
        searchString = "text.valueRaw";
    }
    return $(document).find(`g.${name}`).find(searchString).text();
}

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

function setState(state)
{
    if (!checkStringIsNumber(state["value"]))
    {
        printLog("error", "Received a state update with a value that is not a number: \"" + state["name"] + "\": \"" + state["value"] + "\". Skipping to next state update.");
        return;
    }
    
	let elementGroup = $(document).find("g." + state["name"]);
	if (elementGroup.length === 0)
	{
	    printLog("error", "Received a state update but no element with this name exists in the PnID: \"" + state["name"] + "\": \"" + state["value"] + "\". Skipping to next state update.");
		return;
	}

    let unit = elementGroup.attr("data-unit");
    //raw value without any processing
    elementGroup.find("text.valueRaw").text(state["value"]);
    //human visible value that may contain units or further processing
	elementGroup.find("text.value").text(state["value"] + unit);
	//printLog("info", "Found following elements to update: " + $(document).find("g." + state["name"]));

	//----- prepare for eval behavior block
	//In Variables for the eval() code specified in config.json. Will be reset/overwritten for every state and every loop

	const inVars = {
		"value" : state["value"],
		"unit" : elementGroup.attr("data-unit")
	};
	
	//State storage for the eval() code specified in config.json //TBD (let eval code create entries? pre-define generic name entries? are they even persistent between loops right now?)
	var stateVars = { };
	
	//Return values from eval() code specified in config.json. Will be applied to PnID and cleared for every state and every loop
	let outVars = { };
	
	//----- search applicable eval behavior blocks from config files (either default config or custom config)
	//fetch all classes of the element group into an array
	let classes = elementGroup.attr("class").split(" ");
	
	//check if applicable eval (to current element) exists in default JSON
	for (classIndex in classes) //search through attributes to find class attribute related to type (eg: PnID-Valve_Manual)
	{
		let typeClass = classes[classIndex];
		if (classes.includes("wire"))
		{
			typeClass = "PnID-Sensor_Pressure"; //should this really be hardcoded? is there a reason for it to have to be dynamic? evaluate
		}

		let re = /PnID-\S*/;
		//search for typeClass in the default config and run the eval behavior code and update popups (if applicable)
		if (re.test(typeClass) && (typeClass in defaultConfig))
		{
			eval(defaultConfig[typeClass]["eval"]);
            if (typeClass === "PnID-Tank")
            {
                updateTankContent(elementGroup, state["value"]);
            }
            if (defaultConfig[typeClass]["popup"] != undefined)
            {
                updatePopup(typeClass, state["name"], outVars["value"], state["value"]);
            }
		}
	}

	//traverse custom JSON to find all evals applicable to current element. evals later in JSON overwrite changes made by evals earlier (if they change the same parameters)
	let configProperties = Object.keys(config);
	for (propIndex in configProperties)
	{
		//printLog("info", "searching for state " + state["name"] + " from available states: " + config[configProperties[propIndex]]["states"]);
		if (config[configProperties[propIndex]]["states"].includes(state["name"])) //if the currently traversed property contains our state, check for eval
		{
			eval(config[configProperties[propIndex]]["eval"]);
		}
	}

	applyUpdatesToPnID(elementGroup, outVars);
}

function applyUpdatesToPnID(elementGroup, outVars)
{
	//fetch all attributes of the element group
	let attributes = elementGroup.prop("attributes");
	//printLog("info", "Found these attributes:" + attributes);
	
	//apply all outVars to PnID
	if ("color" in outVars)
	{
		for (attrIndex in attributes)
		{
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
		elementGroup.find("text.value").text(outVars["value"]);
	}
	if ("crossUpdate" in outVars)
	{
	    //console.log(outVars["crossUpdate"], $(document).find('g.purge_solenoid').find('text.value').text());
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
