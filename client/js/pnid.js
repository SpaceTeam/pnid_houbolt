function initPNID(standalone, pathOffset, themes)
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
    setTimeout(restorePopups, 3000); //set timeout is a dirty hack so the popup titles are set by llserver before popups get restored.
    //titles should be able to update though!
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

function authenticateGrafana()
{

}
//test code for theming subscription
/*themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("a", e.detail); });
themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("b", e.detail); });
themeSubscribe(document.querySelector("#logInfo"), function(e) { console.log("c", e.detail); });*/