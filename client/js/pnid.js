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

function authenticateGrafana()
{

}
//test code for theming subscription
/*themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("a", e.detail); });
themeSubscribe(document.querySelector("#pnid"), function(e) { console.log("b", e.detail); });
themeSubscribe(document.querySelector("#logInfo"), function(e) { console.log("c", e.detail); });*/