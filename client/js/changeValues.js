var configString = `{
  "solenoid": {
    "states": [
      "fuel_pressurize_solenoid"
    ],
    "eval": "if (inVars['value'] > 10) { outVars['color']='undefined'; outVars['value']='open'+inVars['value'] } else { outVars['color']='undefined'; outVars['value']='open'+inVars['value']}"
  }
}`;

//todo: evaluate if default configs may benefit from having a state *blacklist* instead of a state *whitelist* like in the custom configs
const defaultConfigString = `{
  "PnID-Valve_Solenoid": {
    "eval": "inVars['value'] > 10 ? outVars['color']='open' : outVars['color']='closed'",
	"popup": "value:checkbox:0:100"
  },
  "PnID-Valve_Servo": {
    "eval": "if (inVars['value'] > 70) { outVars['color']='open' } else if (inVars['value'] > 30) { outVars['color']='throttle'} else { outVars['color']='closed' }",
	"popup": "value:slider:0:100"
  },
  "PnID-Sensor_Pressure": {
    "eval": "inVars['value'] > 1 ? outVars['color']='high' : outVars['color']='low'",
	"popup": "value:display"
  },
  "PnID-Tank": {
    "eval": "",
    "popup": ""
  }
}`;

const defaultConfig = JSON.parse(defaultConfigString);
var config = JSON.parse(configString);

//setup tanks for filling visuals
tankSetup();

function tankSetup()
{
    let tanks = $(document).find("g.PnID-Tank");
    let fuelPaths = tanks.filter(".Fuel").find("path[d*=' A ']");
    let oxPaths = tanks.filter(".Oxidizer").find("path[d*=' A ']");
    fuelPaths.attr(`data-pnid-tank_content`, `fuel`);
    oxPaths.attr(`data-pnid-tank_content`, `ox`);
    createTankContent(tanks);
}

function createTankContent(tanks)
{
    let fuelPaths = extractContentPathsFromTank(tanks.filter(".Fuel"));
    let oxPaths = extractContentPathsFromTank(tanks.filter(".Oxidizer"));

    let fuelContentRect = tanks.filter(".Fuel").find("rect.rect");
    fuelContentRect.attr("data-pnid-tank_content", "fuel");
    fuelContentRect.attr("transform-origin", "center center");
    fuelContentRect.attr("transform", "scale(1,0) translate(0,0)");

    let oxContentRect = tanks.filter(".Oxidizer").find("rect.rect");
    oxContentRect.attr("data-pnid-tank_content", "ox");
    oxContentRect.attr("transform-origin", "center center");
    oxContentRect.attr("transform", "scale(1,0) translate(0,0)");
}

function updateTankContent(tank, fillPercent)
{
    let contentRect = tank.find("rect.rect");
    let scale = fillPercent / 100.0;
    let transformOffset = ((contentRect.attr("height") - contentRect.attr("height") * scale) / 2.0) / scale;
    console.log("scale:", scale, "\noffset:", transformOffset);
    //transformOffset = 0;
    contentRect.attr("transform", `scale(1,${scale}) translate(0,${transformOffset})`);
}

function extractContentPathsFromTank(tank)
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


function startLoop() {
	var i;
	var x = 100;
	var j = 2;
	var increasing = true;
	console.log(document.getElementById("PS_FP_FT1_Text"));
	setInterval(function(){
			if (increasing) {
			j += 1;
			} else {
				j -= 1;
			}
			if (j > 99 || j < 2) {
				increasing = !increasing;
			}
			document.getElementById("OV_FP_FT1").setAttribute("stroke-width", (j/10).toString());
			document.getElementById("PS_FP_FT1_Text").innerHTML = j;
		}, 10);
		
	
}

async function runTests()
{
	var testData = [{"name": "Fuel", "value": 95.0}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "purge_solenoid", "value": 12.0}, {"name": "oxfill_vent_valve", "value": 10}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "purge_solenoid", "value": 6.0}, {"name": "fuel_depressurize_solenoid", "value": 12.0}, {"name": "oxfill_vent_valve", "value": 50}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "fuel_pressurize_solenoid", "value": 20.0}, {"name": "oxfill_vent_valve", "value": 80}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "Fuel", "value": 50.0}, {"name": "Oxidizer", "value": 30.0}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "ox_top_tank_pressure", "value": 32.0}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "ox_bottom_tank_pressure", "value": 32.0}, {"name": "ox_top_tank_pressure", "value": 0.5}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "ox_bottom_tank_pressure", "value": 0.0}, {"name": "chamber_pressure", "value": 40}];
	updatePNID(testData);
	await sleep(1000);
	var testData = [{"name": "fuel_pressurize_solenoid", "value": 5.0}, {"name": "fuel_depressurize_solenoid", "value": 1.0}];
	updatePNID(testData);
	await sleep(1000);
}

//updatePNID(testData);
//updatePNID([{"name": "PnID-Valve_Solenoid", "value": 12.0}, {"name": "solenoid2", "value": 8.0}]);
function updatePNID(stateList)
{
	console.log("Updating PnID with:", stateList);
	
	for (stateIndex in stateList)
	{
		let stateName = stateList[stateIndex]["name"];
		let stateValue = stateList[stateIndex]["value"];
		//console.log("out name: '", stateName, "' value:",  stateValue);
		setState(stateList[stateIndex]);
	}
	
	//$('.' + stateList[0].name).eval(config[stateName]["eval"])
}

function setState(state)
{
	let elementGroup = $(document).find("g." + state["name"]);
	elementGroup.find("text.value").text(state["value"]);
	console.log("Found following elements to update:", $(document).find("g." + state["name"]));
	
	//----- prepare for eval behavior block
	//In Variables for the eval() code specified in config.json. Will be reset/overwritten for every state and every loop
	const inVars = {
		"value" : state["value"]
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
		if ("wire" in classes)
		{
			typeClass = "PnID-Sensor_Pressure"; //should this really be hardcoded? is there a reason for it to have to be dynamic? evaluate
		}

		let re = /PnID-\S*/;
		if (re.test(typeClass) && (typeClass in defaultConfig))
		{
			eval(defaultConfig[typeClass]["eval"]);
            if (typeClass === "PnID-Tank")
            {
                updateTankContent(elementGroup, state["value"]);
            }
		}
	}

	//traverse custom JSON to find all evals applicable to current element. evals later in JSON overwrite changes made by evals earlier (if they change the same parameters)
	let configProperties = Object.keys(config);
	for (propIndex in configProperties)
	{
		//console.log("searching for state", state["name"], "from available states:", config[configProperties[propIndex]]["states"]);
		if (config[configProperties[propIndex]]["states"].includes(state["name"])) //if the currently traversed property contains our state, check for eval
		{
			eval(config[configProperties[propIndex]]["eval"]);
		}
	}
	
	//----- apply results of eval behavior blocks to element
	/*if ("PnID-Sensor_Pressure" in classes) //if the element currently being updated is a pressure sensor, update its corresponding wire group
	{
		console.log("Need to update wire group:", state["name"]);
		updatePNID([{"name": state["name"] + "_wire", "value": state["value"]}])
	}
	else
	{
		
	}*/
	applyUpdatesToPnID(elementGroup, outVars);
}

function applyUpdatesToPnID(elementGroup, outVars)
{
	//fetch all attributes of the element group
	let attributes = elementGroup.prop("attributes");
	//console.log("Found these attributes:", attributes);
	
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
		updatePnID(outVars["crossUpdate"]);
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
