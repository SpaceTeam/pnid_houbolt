function initPNID(standalone, pathOffset, themes, pnidName)
{
    if (standalone)
    {
        let themeSwitcherContainer = $(`<div class="themeSwitcher"></div>`).appendTo($(document.body));
        initThemes(themeSwitcherContainer, pathOffset, themes);
        authenticateGrafana();
    }

    initTanks();
    initPumps();
    initPNIDHitboxes();
    hideAllPnIDPopups();
    currentPnID = pnidName;
    restorePopupsFromLocalStorage();
    createWireLinks();

    //add a check if we want that added (url param?)
    createLogBox();
}

function loadValuesPNID(states)
{
    for (const [key, value] of Object.entries(REFERENCE_VALUES)) 
    {
        if (states[stateIndex]["name"].includes("pressurant_tanking_valve:") ||
        states[stateIndex]["name"].includes("pressurant_vent_valve:"))
        {
            continue;
        }
        let re = new RegExp('.*:'+key+'$','g');
        if (states[stateIndex]["name"].match(re))
        {
            if (Array.isArray(value) && value.length > 0)
            {
                states[stateIndex]["name"] = "gui:"+states[stateIndex]["name"].replace(":"+key,":"+value[0]);

                for (let i=1; i < value.length; i++)
                {   
                    let clone = JSON.parse(JSON.stringify(states[stateIndex]));
                    clone["name"] = clone["name"].replace(":"+key,":"+value[i]);
                    states.push(clone);
                }
                
            }
            else
            {
                states[stateIndex]["name"] = "gui:"+states[stateIndex]["name"].replace(":"+key,":"+value);
            }

        }
    }
    updatePNID(states);
}

function parseStateType(state)
{
    if (state["name"].startsWith("gui-"))
    {
        //if a state starts with "gui:" it's either a Get/SetState state, in the sense of a set point as opposed to a feedback/sensor value
        //these states should only be used to update input elements in popups, nothing else, as the rest of the pnid should be feedback value based.
        //or it could be an action reference
        if (getIsActionReference(state["name"]))
        {
            return StateTypes.actionReference;
        }
        return StateTypes.guiEcho;
    }
    
    if (state["wires_only"] == true || state["name"].endsWith("-wire"))
    {
        return StateTypes.wire;
    }
    else if (state["name"].endsWith("-sensor"))
    {
        return StateTypes.sensor;
    }

    return StateTypes.setState;
}

function extractStateName(fullName, stateType)
{
    switch (stateType)
    {
        case StateTypes.sensor:
            return fullName; //todo: I'm not sure if it wouldn't make more sense to not have the :sensor postfix in the kicad elements, worth revisiting before the rewrite
        case StateTypes.guiEcho:
            return fullName.replace("gui-", "");
        case StateTypes.actionReference:
            return fullName; //todo: should this include the gui- prefix?
        case StateTypes.setState:
            return fullName;
        case StateTypes.wire:
            return fullName.replace("__child_wire", "");
        default:
            //printLog("warning", `Tried extracting state name from "${fullName}" with type ${stateType.toString()}, but don't know how to handle this!`);
            console.log(`Tried extracting state name from "${fullName}" with type ${stateType.toString()}, but don't know how to handle this!`);
            return fullName;
    }
}

function findUnitFromElements(elements)
{
    let unit = "";
    elements.each(function (index) {
        let arrayUnit = elements[index].dataset.unit;
        if (arrayUnit != undefined && arrayUnit != "")
        {
            unit = arrayUnit;
            return; //todo: I don't think this actually breaks the loop. I don't *particularly* care, but it would be nicer if it would stop iterating here
        }
    });
    return unit;
}

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
    
    for (let stateIndex in stateList)
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

function initPNIDHitboxes()
{
    let pnidComps = $("g.comp");
    pnidComps.each(function (index) {
        //only create bounding box rectangle if there is a popup definition for it - otherwise it doesn't need the hitbox
        //the .replace("_Slim", "") is a dirty hack to get the other variant of tanks to use the same config as the main type
        if (getConfigData(defaultConfig, getTypeFromClasses(pnidComps.eq(index).attr("class").split(" ")).replace("_Slim", "").replace("_Short", ""), "popup") != undefined ||
            getConfigData(config, getValReferenceFromClasses(pnidComps.eq(index).attr("class").split(" ")).replace("_Slim", "").replace("_Short", ""), "popup") != undefined
        ) {
            let boundingBox = pnidComps.eq(index).find("g")[0].getBBox();
            let oldBound = pnidComps.eq(index).children().filter('rect[pointer-events="all"]').first();
            oldBound.attr("x", boundingBox["x"]);
            oldBound.attr("y", boundingBox["y"]);
            oldBound.attr("width", boundingBox["width"]);
            oldBound.attr("height", boundingBox["height"]);
        }
    });
}

function toggleHitboxDisplay()
{
    let hitboxes = $("g.comp").find('rect[pointer-events="all"]');
    hitboxes.each(function (index) {
        let visibility = hitboxes.eq(index).attr("visibility");
        if (visibility === "hidden")
        {
            hitboxes.eq(index).attr("visibility", "visible");
        }
        else if (visibility == "visible")
        {
            hitboxes.eq(index).attr("visibility", "hidden");
        }
    });
}

function authenticateGrafana()
{

}
//test code for theming subscription
/*themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("a", e.detail); });
themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("b", e.detail); });
themeSubscribe(document.querySelector("#logInfo"), function(e) { console.log("c", e.detail); });*/