var activePopups = {};

var popupMoved = "";
var popupResized = "";

let grafanaPanelConfig = {};
$.get('/pnid_config/grafana', function(data) {
    grafanaPanelConfig = data;
});


function deactiveInputUpdate(popupID, duration)
{
    if (activePopups[popupID]["timeUntilActive"] > 0) //there's already one timer counting, so just reset it back to full duration
    {
        activePopups[popupID]["timeUntilActive"] = duration; // timer has a resolution of 1/10th of a second
        return;
    }
    activePopups[popupID]["timeUntilActive"] = duration; // timer has a resolution of 1/10th of a second
    activePopups[popupID]["timer"] = setInterval(function () {
        activePopups[popupID]["timeUntilActive"] -= 1;
        if (activePopups[popupID]["timeUntilActive"] <= 0)
        {
            clearInterval(activePopups[popupID]["timer"]);
            activePopups[popupID]["timeUntilActive"] = 0;
        }
    }, 100);
}

//popup ID is the GUI ID (action_reference in kicad)
function clickEventListener(popupID)
{
    // check if popup already exists
    if (popupID in activePopups && activePopups[popupID]["visibility"] == true) // if already exists and visible, highlight
	{
		activePopups[popupID]["popup"].css({"animation-name": "none"});
		setTimeout( function() {
		    activePopups[popupID]["popup"].css({"animation-name": "highlight", "animation-duration": "2s"});
		}, 100);
	}
	else // if doesn't exist, create, if just hidden, show
	{
        if (popupID in activePopups) //just hidden, no need to create again
        {
            activePopups[popupID]["popup"].fadeIn(100);
            activePopups[popupID]["visibility"] = true;
        }
        else
        {
            let isActionReference = false;
            let popupParent = $(document).find(`g.${popupID}`);
            //printLog("info", popupParent);
            if (popupParent.length === 0)
            {
                popupParent = $(document).find(`g[action-reference='${popupID}']`);
                isActionReference = true;
            }
            createPopup(popupID, popupParent.not(".wire").not(".PnID-ThermalBarrier"), isActionReference); //not a huge fan that the thermalbarrier is hardcoded here, but got no better solution right now. if not sometimes popups wouldn't work
        }
	}
}

//same as with initPNIDHitboxes - should this be here?
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

//should this really be in the popup manager? right now the hitboxes are only used for this, but maybe in the future not?
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

function restorePopups()
{
    //I dislike having to iterate through every key in local storage to find popups
    //but maintaining a separate key with an array of popups in local storage sucks even more.
    //I could be using the activePopups dict, but that also contains closed popups and I only
    //want to store visible popups in the local storage and maintaining a second dict just with
    //active popups sounds like an even worse time
    let localStorageKeys = Object.keys(window.localStorage);

    for (let i in localStorageKeys) {
        if (localStorageKeys[i].startsWith("popup_")) {
            let popupID = localStorageKeys[i].replace("popup_", "");
            let popupData = JSON.parse(window.localStorage.getItem(`popup_${popupID}`));
            let parent = $(document).find(`.${popupData["parentRef"]}.${popupData["parentValRef"]}`);
            //console.log("create popup with", popupID, popupData["x"], popupData["y"], popupData["width"],popupData["height"]);
            if (parent.length > 0)
            {
                //todo I dislike that I have this rather long visibility check doubled here and in the click event listener
                if (popupID in activePopups && activePopups[popupID]["visibility"] == true) // if already exists and visible, highlight
                {
                    activePopups[popupID]["popup"].css({"animation-name": "none"});
                    setTimeout( function() {
                        activePopups[popupID]["popup"].css({"animation-name": "highlight", "animation-duration": "2s"});
                    }, 100);
                }
                else // if doesn't exist, create, if just hidden, show
                {
                    if (popupID in activePopups) //just hidden, no need to create again
                    {
                        //console.log("restoring popup", popupID);
                        activePopups[popupID]["popup"].fadeIn(100);
                        activePopups[popupID]["visibility"] = true;
                    }
                    else
                    {
                        //console.log("creating popup", popupID, parent);
                        createPopup(popupID, parent, popupData["isActionReference"], popupData["x"], popupData["y"], popupData["width"], popupData["height"]);
                    }
                }
            }
        }
    }
}

function createCollapsibleWrapper(popupID, variable, config)
{
    let wrapper = $("#collapseWrapperTemp").clone();
    wrapper.removeAttr("id");
    wrapper.find("button").attr("onclick", `toggleCollapsibleHandler('${popupID}-${variable}')`);
    wrapper.attr("id", `${popupID}-${variable}`);
    wrapper.find("div.popup-collapse-label").text(config["collapsibleLabel"] != undefined ? config["collapsibleLabel"] : "Hidden");
    return wrapper;
}

function createTextDisplay(variable, curValue)
{
    let element = $("#textDisplayTemp").clone();
    element.removeAttr("id");
    element.find(".popup-value-out").attr("display", variable);
    element.find(".popup-value-out").text(curValue);
    return element;
}

function constructIframeSource(sourceDefault, config, customConfig, popupID)
{
    let finalSource = "";
    if (sourceDefault == undefined)
    {
        sourceDefault = "";
    }
    let source = config["source"];

    let customSource = "";
    if (grafanaPanelConfig[popupID] != undefined)
    {
        customSource = grafanaPanelConfig[popupID];
    }

    //try creating a URL from the source field in default config. if it's a fully valid URL overwrite the default URL, else handle it as a path specified and append it to the default source
    try
    {
        let url = new URL(source);
        finalSource = source;
    }
    catch (_)
    {
        if (source == undefined)
        {
            source = "";
        }
        finalSource = sourceDefault + source;
    }
    if (config["autoID"] != false && config["autoID"] != undefined)
    {
        finalSource += popupID;
    }

    try
    {
        let url = new URL(customSource);
        finalSource = customSource;
    }
    catch (_)
    {
        if (customSource != undefined)
        {
            finalSource += customSource;
        }
    }
    if (config["autoID"] != false && config["autoID"] != undefined)
    {
        finalSource += popupID;
    }

    if (finalSource == undefined || finalSource == "")
    {
        printLog("warning", `Tried constructing a valid source for external popup display (${popupID}), but couldn't find either in default nor custom config.`); //TODO consider maybe going for a "continue;" here - does it ever make sense to not skip the rest in this case?
    }
    return finalSource;
}

function createExternalDisplay(config, source)
{
    let width = 300;
    let height = 200;
    if (config["width"] != undefined)
    {
        width = config["width"];
    }
    if (config["height"] != undefined)
    {
        height = config["height"];
    }
    let element = $("#externalDisplayTemp").clone();
    element.removeAttr("id");
    //element.find("iframe").attr("width", width);
    //element.find("iframe").attr("height", height);
    element.find("iframe").attr("src", source);
    themeSubscribe(element, function(){iframeThemeToggle(event)}); //this is kinda hardcoded to work with grafana, but I have no freaking clue how I could do that more generalized and/or customizable
    return element;
}


function createCheckbox(config, variable, popupID, curValue)
{
    let element = $("#digitalOutTemp").clone();
    element.removeAttr("id");
    element.find(".ckbx-label").text(variable).attr("for", popupID);
    element.find("input").attr('id', popupID).attr('state', variable);
    element.find("input").attr("onclick", `onDigitalCheck(this, "${config['action'] != undefined ? config['action'] : ''}")`);

    let highThreshold = config["high"];
    let lowThreshold = config["low"];
    if (curValue === highThreshold)
    {
        element.find("input").prop("checked", true);
    }
    else if (curValue === lowThreshold)
    {
        element.find("input").prop("checked", false);
    }
    else
    {
        printLog("error", `Encountered a value that doesn't correspond to either high (${highThreshold}) or low (${lowThreshold}) value for popup (${popupID}) display: '${curValue}'! Defaulting to unchecked.`);
        element.find("input").prop("checked", false);
    }
    return element;
}

function createSlider(config, variable, popupID, curRawValue)
{
    let element = $("#sliderTemp").clone();
    element.removeAttr("id");
    //newContentRow.find(".range-slider").attr("title", popupID);
    //newContentRow.find(".range-slider-label").text(popupID);
    element.find(".range-slider-label").remove();
    if (!checkStringIsNumber(curRawValue)) //not really needed anymore now that there is global input validation (right when states come in value is checked for being a number)
    {
        printLog("warning", `Encountered state value that isn't a number while creating <code>${popupID}</code> popup: ${curRawValue}. Defaulting to '0'.`);
        curRawValue = 0;
    }
    //newContentRow.find("input").first().attr("value", Math.round(curRawValue)).attr("state", variable);
    element.find("input").attr("min", config["min"]);
    element.find("input").attr("max", config["max"]);
    element.find("input").attr("step", config["step"]);
    element.find("input").first().val(Math.round(curRawValue/config["max"])).attr("state", variable);
    rangeSlider(element);
    element.find(".range-slider__value").text(Math.round(curRawValue)).attr("title", popupID);
    return element;
}

function createTextEntry(config, variable, popupID, curRawValue)
{
    let element = $("#numberEntryTemp").clone();
    element.removeAttr("id");
    if (!checkStringIsNumber(curRawValue))
    {
        curRawValue = 0;
    }
    element.find("label").text(config["label"]);

    let numberInput = element.find("input[type=number]");
    numberInput.attr("min", config["min"]);
    numberInput.attr("max", config["max"]);
    numberInput.attr("data-suffix", config["suffix"]);
    numberInput.attr("id", variable);
    numberInput.attr("placeholder", variable);
    numberInput.attr("state", variable);
    numberInput.inputSpinner();
    numberInput = element.find("input[type=number]")
    numberInput.attr("id", variable);
    element.find("div.input-group").attr("style", "width: 60%");
    

    let button = element.find("input[type=button]");
    button.attr("onclick", `onNumberInput("${variable}", "${config['action'] != undefined ? config['action'] : ''}")`);

    return element;
}

function createButton(config, variable, popupID, curRawValue)
{
    let element = undefined;
    if (config["style"] == "button")
    {
        element = $("#buttonEntryTemp").clone();
    }
    else
    {
        element = $("#buttonDangerEntryTemp").clone();
    }
    element.removeAttr("id");
    element.find("input").attr("value", config["label"]);
    element.find("input").attr("onclick", `onButtonInput("${variable}", "${config['action'] != undefined ? config['action'] : ''}")`);
    return element;
}

function createSeparator()
{
    let element = $("#separatorTemp").clone();
    element.removeAttr("id");
    return element;
}

function appendPopupContent(popup, popupConfig, popupID, isActionReference)
{
    //all states contained in a popup which may need updating
    let containedStates = [];

    //construct popup content
    for (contentIndex in popupConfig)
    {
        //this variable loading doesn't support elements with other variables
        let curValue = 0;
        let curRawValue = 0;
        if (isActionReference) // if it is action reference, load the values from there instead of the normal pnid values
        {
            curValue = getElementValue(popupID, "actionReferenceValue");
            curRawValue = getElementValue(popupID, "actionReferenceValueRaw");
        }
        else
        {
            curValue = getElementValue(popupID, "value");
            //printLog("info", curValue);
            curRawValue = getElementValue(popupID, "valueRaw");
            //printLog("info", curRawValue);
        }
        let rowConfig = popupConfig[contentIndex];
        let contentType = rowConfig["type"];
        let contentStyle = rowConfig["style"];
        let variableName = rowConfig["variable"];
        if (variableName === "value")
        {
            //if the variable is "value", this popup element listens to the popup parent state
            variableName = popupID;
        }
        else
        {
            //if the variable name is something else, push it to the contained states and try getting curValue
            containedStates.push(variableName);
            
            //if we have a poll variable specified, send it to llserver to cause a response with the current value
            if (rowConfig["poll_var"] != undefined)
            {
                stateUpdate(rowConfig["poll_var"], 1);
                //not sure what will happen with asynchronous execution (is it even executed async?)
                //if creating popup isn't finished by the time the response from the onPNIDInput comes back I don't know if it will be found
            }
            
        }
        let newContentRow;
        switch (contentType)
        {
            case "display":
                switch (contentStyle)
                {
                    case "text":
                        newContentRow = createTextDisplay(popupID, curValue);
                        break;
                    case "external":
                        popup.css("width", "400px");
                        popup.css("height", "300px");
                        let customConfig = getConfigData(config, popupID.replaceAll("-",":"), "popup"); //TODO this custom config thing doesn't really allow for several different custom data fields to be entered - eg: two different sources for two different external displays. only a fringe use case imo, but should be looked into at some point
                        let sourceDefault = defaultConfig["externalSourceDefault"];
                        let iframeSource = constructIframeSource(sourceDefault, rowConfig, customConfig, popupID.replaceAll("-",":"));
                        newContentRow = createExternalDisplay(rowConfig, iframeSource);
                        break;
                    case "separator":
                        newContentRow = createSeparator();
                        break
                    default:
                        printLog("warning", `Unknown display style for popup (${popupID}) encountered in config: '${contentStyle}'`);
                        break;
                }
                break;
            case "input":
                switch (contentStyle)
                {
                    case "checkbox":
                        newContentRow = createCheckbox(rowConfig, variableName, popupID, curRawValue);
                        break;
                    case "slider":
                        newContentRow = createSlider(rowConfig, variableName, popupID, curRawValue);
                        break;
                    case "numberEntry":
                        newContentRow = createTextEntry(rowConfig, variableName, popupID, curRawValue);
                        //printLog("warning", "Style 'textEntry' not yet implemented for input styles in popups");
                        break;
                    case "button":
                        newContentRow = createButton(rowConfig, variableName, popupID, curRawValue);
                        //printLog("warning", "Style 'textEntry' not yet implemented for input styles in popups");
                        break;
                    case "buttonDanger":
                        newContentRow = createButton(rowConfig, variableName, popupID, curRawValue);
                        //printLog("warning", "Style 'textEntry' not yet implemented for input styles in popups");
                        break;
                    default:
                        printLog("warning", `Unknown input style for popup (${popupID}) encountered in config: '${contentStyle}'`);
                        break;
                }
                break;
            default:
                printLog("warning", `Unknown content type while to create popup (${popupID}): '${contentType}'`);
                break;
        }
        if (rowConfig["collapsible"] == true)
        {
            let wrapper = createCollapsibleWrapper(popupID, variableName, rowConfig);
            newContentRow.removeClass("popup-row");
            wrapper.find("div.popup-collapse-content").append(newContentRow);
            popup.append(wrapper);
        }
        else
        {
            popup.append(newContentRow);
        }
    }
    return containedStates;
}

//TODO consider breaking into several smaller functions
function createPopup(popupID, parent, isActionReference, x = undefined, y = undefined, width = undefined, height = undefined)
{
	let parentPosition = parent.offset();
    //printLog("info", parent);
	
	let popupClone = $("#popupTemp").clone();
	popupClone.removeAttr('id');
	// I'd like to not have to have the width and height specified here, but when it's in the .css it gets ignored unless written with !important because the style here is more specific
	popupClone.attr('style', `width: auto; height: auto;`);
	
	popupClone.find("div.row").find(".btn-close").first().on('click', function(){destroyPopup(popupID);});
	popupClone.find("div.row").find(".btn-drag").first().on('mousedown', function(e) {
		isDown = true;
		target = popupClone[0];
		offset = [
			popupClone[0].offsetLeft - e.clientX,
			popupClone[0].offsetTop - e.clientY
		];
	});
	
	let parentClasses = parent.attr("class").split(" ");
	let title = "";
	if (isActionReference) //if popup is for action reference, set name of action reference as title. TODO this is not really a human readable name, add a feature (how?) to get human readable action references
	{
	    title = popupID;
	}
	else
	{
	    title = getElementValue(getValReferenceFromClasses(parentClasses), "reference");
	}
    popupClone.find("div.popup-heading").first().text(title);

    let type = getTypeFromClasses(parentClasses);
    if (popupID in defaultConfig) // indicates a custom action reference that wants/needs its own popup definition
    {
        type = popupID;
    }
    if (defaultConfig[type] === undefined)
    {
        return; //would be nice if this would be called earlier so less code is run uselessly, but it's not really a point where optimization is *needed*
    }
    
    let popupConfig = getConfigData(defaultConfig, type, "popup");
    if (popupConfig == undefined)
    {
        printLog("warning", `Tried creating a popup from ID "${popupID}" with type "${type}", but no popup configuration was found.`); //does this make sense to print? this can be 100% wanted/intended to be the case
        return;
    }

    let containedStates = appendPopupContent(popupClone, popupConfig, popupID, isActionReference);

    if (isActionReference) //if it is an action reference, append all pnid elements' popup content rows to the current popup TODO Consider whether this should be toggleable behind a config flag
    //TODO if it should have a config flag, every part where I update needs to check this flag to not create bugs. eg: update popup for updating bundled states in action reference popups
    {
        popupClone.append(createTextDisplay("none", "Bundled PnID element inputs:")); //at some point change this to another element, possibly a collapsible element
        parent.each(function(index) {
            let parentReference = getValReferenceFromClasses(parent.eq(index).attr("class").split(" "));
            let parentType = getTypeFromClasses(parent.eq(index).attr("class").split(" "));
            appendPopupContent(popupClone, getConfigData(defaultConfig, parentType, "popup"), parentReference, false);
        });
        //appendPopupContent(popupClone);
    }

    $(document.body).append(popupClone);
    //todo this may have unwanted behavior if only one of the two is undefined
    if (width != undefined && height != undefined)
    {
        if (popupClone.style == undefined)
        {
            popupClone.style = "";
        }
        popupClone.width(width);
        popupClone.height(height);
        //popupClone.css("width", width+"px");
        //popupClone.css("height", height+"px");
        //console.log("popup clone css", popupClone.css("width"));
    }
    let popupSize = [popupClone.outerWidth(), popupClone.outerHeight()];
    //console.log("pop size:", popupSize);
    let viewportSize = [Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0), Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)];
    //console.log("view size:", viewportSize);
    let minPopupPad = 0.02; //in %
    let popupDistance = 10;
    let popupPosition = [0,0];
    if (x == undefined || y == undefined)
    {
        popupPosition = [parentPosition.left, parentPosition.top + parent[0].getBoundingClientRect().height + popupDistance];
        //TODO with better pnid element bounding boxes the positioning of the popup should be done better
        if (parentPosition.top + popupSize[1] > viewportSize[1] * (1 - minPopupPad))
        {
            //popupPosition[1] = viewportSize[1] * (1 - minPopupPad) - popupSize[1];
            popupPosition[1] = parentPosition.top - popupSize[1] - popupDistance;
        }
        if (parentPosition.left + popupSize[0] > viewportSize[0] * (1 - minPopupPad))
        {
            popupPosition[0] = viewportSize[0] * (1 - minPopupPad) - popupSize[0];
        }
    }
    else
    {
        popupPosition = [x, y];
    }
    
    //console.log("pop pos:", popupPosition);
    
    //console.log("pop pos2:", popupPosition);
    popupClone.css("top", popupPosition[1]+"px");
    popupClone.css("left", popupPosition[0]+"px");

    popupClone.attr("data-popup-id", popupID);
	popupClone.fadeIn(100);
    
	activePopups[popupID] = {
	    "popup": popupClone,
	    "config": popupConfig,
        "containedStates": containedStates,
        "timer": undefined,
        "timeUntilActive": 0, // if 0 it should listen to updates, if higher it should count down
        "visibility": true
	};

    //let resize observer watch for this popup
    resizeObserver.observe(popupClone.get(0));

    //add popup to localstorage
    window.localStorage.setItem(
        `popup_${popupID}`,
        JSON.stringify({
            parentRef: getReferenceFromClasses(parentClasses),
            parentValRef: getValReferenceFromClasses(parentClasses),
            isActionReference: isActionReference,
            x: popupPosition[0],
            y: popupPosition[1],
            width: width,
            height: height
        })
    );
}

function updatePopupTitle(popupID, newTitle)
{
    if (popupID in activePopups)
    {
        activePopups[popupID]["popup"].find("div.popup-heading").first().text(newTitle);
    }
}

function updatePopup(stateName, value, rawValue, isGuiState = false, isActionReference = false, popupID = undefined)
{
    let bundledInActionReference = false;
    //if the popup ID is undefined, search for it. if it's already defined it's likely a sub state of the popup (not bundled action ref)
    if (popupID == undefined)
    {
        if (stateName in activePopups) //if popup for a certain state name does exist, simply update it.
        {
            //console.log("found state name in active popups", stateName);
            popupID = stateName;
        }
        else //if popup for a certain state name doesn't exist, check if the state name may be bundled in an action reference popup.
        {
            //console.log("didn't find state name in active popups", stateName);
            let actionReference = getElementAttrValue(stateName, "action-reference");
            //console.log("actionref", actionReference);
            if (actionReference in activePopups) //if there is an active popup of an action reference that bundles this state display
            {
                popupID = actionReference;
                bundledInActionReference = true;
            }
            else //if there is no popup for it AND no action reference that may have bundled it, there is nothing to udpate - so don't update anything.
            {
                return;
            }
        }
    }

    let popup = activePopups[popupID]["popup"];
    let popupConfig = activePopups[popupID]["config"]; //default popup config, just search for the popupID and get the config stored next to it
    if (stateName != popupID && bundledInActionReference) //if state name and popupID differ, we are currenty updating a state that doesn't have its own popup,
    //but is bundled in an action reference popup. this means we have to search for its popup config
    {
        /*console.log("elem", getElement(stateName));
        console.log("elem classes", getElement(stateName).attr("class").split(" "));
        console.log("type", getElement(stateName).attr("class").split(" "));*/
        popupConfig = getConfigData(defaultConfig, getTypeFromClasses(getElement(stateName).first().attr("class").split(" ")), "popup");
        if (popupConfig == undefined) //if this bundled state has no popup config it also can't have a bundled element in the action reference popup, so there is nothing to update
        {
            return;
        }
    }
    
    for (contentIndex in popupConfig)
    {
        let rowConfig = popupConfig[contentIndex];
        let contentType = rowConfig["type"];
        let contentStyle = rowConfig["style"];
        let elements = {};
        //only update this popup row if it's the right variable for it
        //console.log("updating rowconfig", rowConfig, stateName, popupID);
        if (stateName == rowConfig["variable"] || (stateName == popupID && rowConfig["variable"] == "value"))
        {
            //console.log("updating row");
            switch (contentType)
            {
                case "display":
                    switch (contentStyle)
                    {
                        case "text":
                            //only update the text for actual sensor feedback values, not GUI states/set points. TODO consider adding a switch for that in the config
                            if (!isGuiState || isActionReference)
                            {
                                elements = $(popup).find(`[display="${stateName}"]`);
                                elements.text(value);
                            }
                            break;
                        case "external": //no update needed
                            break;
                        default:
                            printLog("warning", `Unknown display style while trying to update popup (${popupID}) with state (${stateName}): '${contentStyle}'`);
                            break;
                    }
                    break;
                case "input":
                    if (activePopups[popupID]["timeUntilActive"] > 0)
                    {
                        //disable the update pause after user input for now. since sliders now have their value and feedback separated,
                        //it isn't really needed anymore. evaluate if it should be removed altogether or not
                        //continue;
                    }
                    switch (contentStyle)
                    {
                        case "checkbox":
                            if (isGuiState || isActionReference)
                            {
                                //console.log("updating gui state checkbox", rawValue);
                                //if the value is the echoed setpoint, update the input, if it's the sensor feedback value don't
                                elements = $(popup).find(`input#${stateName}[type=checkbox]`);
                                if (rawValue.toString() === rowConfig["low"])
                                {
                                    elements.prop("checked", false);
                                }
                                else
                                {
                                    elements.prop("checked", true);
                                }
                            }
                            break;
                        case "slider":
                            elements = $(popup).find(`input.range-slider__range[state=${stateName}][type=range]`);
                            if (!isGuiState)
                            {
                                //if the value is sensor feedback, update the feedback slider background
                                if (!checkStringIsNumber(rawValue)) //not really needed anymore now that there is global input validation (right when states come in value is checked for being a number)
                                {
                                    printLog("warning", `Encountered state value that isn't a number while updating <code>'${popupID}'</code> popup with state <code>'${stateName}'</code>: ${rawValue}. Ignoring update.`);
                                    break;
                                }
                                setSliderFeedback(elements, Math.round(rawValue))
                            }
                            else
                            {
                                //if the value is not sensor feedback, but a set point instead, move the slider
                                if (!sliderIsMoving())
                                {
                                    //but only if the slider isn't being moved right now
                                    setSliderValue(elements, Math.round(rawValue));
                                }
                                /*elements.val(Math.round(rawValue));
                                let valueOut = elements.siblings("span.range-slider__value");
                                valueOut.text(Math.round(rawValue));*/
                            }
                            break;
                        case "numberEntry":
                            //console.log("updating number entry");
                            //todo: I kinda dislike that I'm using the placeholder for checking the variable but it's the easiest I can do rn
                            elements = $(popup).find("input[type=number]").filter(`[placeholder=${stateName}]`);
                            //console.log('updating following elems', elements);
                            //TODO: this fix for checking the state name is crucial also for other popup elements that need updating, add later
                            elements.val(rawValue);
                            elements.siblings().find("input.form-control").removeClass("uncommitted-highlight");
                            //todo some sort of check whether the input is currently active/in focus to not update it in this case. check what the intended behavior should be
                            break;
                        default:
                            printLog("warning", `Unknown input style while trying to update popup (${popupID}) with state (${stateName}): '${contentStyle}'`);
                            break;
                    }
                    break;
                default:
                    printLog("warning", `Unknown content type while trying to update popup (${popupID}) with state (${stateName}): '${contentType}'`);
                    break;
            }
        }
    }
}

function iframeThemeToggle(event)
{
    //console.log("event", event.detail);
    let iframeRow = event.currentTarget;
    let iframe = $(iframeRow).find("iframe");
    let url = new URL(iframe.attr("src"));
    let params = new URLSearchParams(url.search);
    params.set("theme", event.detail["type"]);
    url.search = params.toString();
    //console.log(url);
    iframe.attr("src", url.toString());
    //console.log(iframe);

}

function destroyPopup(popupID)
{
    $(activePopups[popupID]["popup"]).fadeOut(100, function() {
        if (activePopups[popupID]["timer"] != undefined)
        {
            clearInterval(activePopups[popupID]["timer"]);
        }
        activePopups[popupID]["visibility"] = false;
        window.localStorage.removeItem(`popup_${popupID}`);
        //activePopups[popupID]["popup"].remove();
        //delete activePopups[popupID];
    });
}

function clearLocalStorage()
{
    window.localStorage.clear();
}

var mousePosition;
var offset = [0,0];
var target;
var isDown = false;

document.addEventListener('mouseup', function(event) {
    isDown = false;
    if (popupMoved != "")
    {
        try
        {
            //console.log(`popup moved: '${popupMoved}', ${popupMoved.length}`);
            let oldPopupData = JSON.parse(window.localStorage.getItem(`popup_${popupMoved}`));
            if (oldPopupData != undefined)
            {
                //console.log("old popup data", oldPopupData);
                oldPopupData["x"] = target.offsetLeft;
                oldPopupData["y"] = target.offsetTop;
                window.localStorage.setItem(`popup_${popupMoved}`, JSON.stringify(oldPopupData));
            }
            else
            {
                console.log("getting popup data structure from local storage failed for", popupMoved);
            }
            
        }
        catch (e)
        {
            console.log("exception occurred when trying to store popup move:", e);
        }
        finally
        {
            popupMoved = "";
        }
    }
    if (popupResized != "")
    {
        //unfortunately resize events work differently so I can't use target here
        try
        {
            if (activePopups[popupResized]["visibility"] == true)
            {
                //apparently resize also gets triggered if visibility is set to hidden which breaks the following code (we don't even want that)
                let oldPopupData = JSON.parse(window.localStorage.getItem(`popup_${popupResized}`));
                if (oldPopupData != undefined)
                {
                    oldPopupData["width"] = activePopups[popupResized]["popup"].width();
                    oldPopupData["height"] = activePopups[popupResized]["popup"].height();
                    window.localStorage.setItem(`popup_${popupResized}`, JSON.stringify(oldPopupData));
                }
                else
                {
                    console.log("getting popup data structure from local storage failed for", popupMoved);
                }
            }
        }
        catch (e)
        {
            console.log("exception occurred when trying to store popup resize:", e);
        }
        finally
        {
            popupResized = "";
        }
    }
	// target = undefined;
}, true);

var resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        popupResized = entry.target.dataset.popupId;
    }
});

document.addEventListener('onresize', function(event) {
    console.log("resize");
    popupResized = target.dataset.popupId;
}, true);

document.addEventListener('mousemove', function(event) {
    // event.preventDefault();
	
    if (isDown) {
		// printLog("info", "here");
        mousePosition = {

            x : event.clientX,
            y : event.clientY

        };
        target.style.left = (mousePosition.x + offset[0]) + 'px';
        target.style.top  = (mousePosition.y + offset[1]) + 'px';
        popupMoved = target.dataset.popupId;
        //console.log("target", popupMoved, target, event);
    }
}, true);

function toggleCollapsibleHandler(event)
{
    let buttonIcon = $(`button[onclick="toggleCollapsibleHandler('${event}')"]`).find("i");
    let wrapper = $(`#${event}`);
    let content = wrapper.find("div.popup-collapse-content");
    let label = wrapper.find("div.popup-collapse-label");
    
    if (content.is(":visible"))
    {
        buttonIcon.removeClass("bi-eye-slash-fill");
        buttonIcon.addClass("bi-eye-fill");
        content.fadeOut(50, function(){ 
            label.fadeIn(50);
        });
    }
    else
    {
        buttonIcon.removeClass("bi-eye-fill");
        buttonIcon.addClass("bi-eye-slash-fill");
        label.fadeOut(100, function(){ 
            content.fadeIn(100);
        });
    }
}