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

function authenticateGrafana()
{

}
//test code for theming subscription
/*themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("a", e.detail); });
themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("b", e.detail); });
themeSubscribe(document.querySelector("#logInfo"), function(e) { console.log("c", e.detail); });*/