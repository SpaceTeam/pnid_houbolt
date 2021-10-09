function initPNID(standalone, pathOffset, themes)
{
    if (standalone)
    {
        let themeSwitcherContainer = $(`<div class="themeSwitcher"></div>`).appendTo($(document.body));
        initThemes(themeSwitcherContainer, pathOffset, themes);
    }
    initTanks();

    //add a check if we want that added (url param?)
    createLogBox();
}

//test code for theming subscription
/*subscribe(document.querySelector("#pnid"), function(e) { console.log("a", e.detail); });
subscribe(document.querySelector("#pnid"), function(e) { console.log("b", e.detail); });
subscribe(document.querySelector("#logInfo"), function(e) { console.log("c", e.detail); });*/
