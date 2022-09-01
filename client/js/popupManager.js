var activePopups = {};
var currentPnID = undefined;

var popupMoved = "";
var popupResized = "";

let grafanaPanelConfig = {};
$.get('/pnid_config/grafana', function(data) {
    grafanaPanelConfig = data;
});


//popup ID is the GUI ID (action_reference in kicad)
function clickEventListener(popupID)
{
    // check if popup already exists
    if (popupID in activePopups && activePopups[popupID]["visibility"] == true) // if already exists and visible, highlight
	{
		highlightPopup(popupID);
	}
	else // if doesn't exist, create, if just hidden, show
	{
        if (activePopups[currentPnID] != undefined && popupID in activePopups[currentPnID]) //just hidden, no need to create again
        {
            unhidePopup(popupID);
        }
        else
        {
            let stateType = StateTypes.sensor;
            let popupParent = $(document).find(`g.${popupID}`);
            //printLog("info", popupParent);
            if (popupParent.length === 0)
            {
                popupParent = $(document).find(`g[data-action-reference='${popupID}']`);
                stateType = StateTypes.actionReference;
            }
            createPopup(popupID, popupParent.not(".wire").not(".PnID-ThermalBarrier"), stateType);
            //not a huge fan that the thermalbarrier is hardcoded here, but got no better solution right now. if not sometimes popups wouldn't work
        }
	}
}

function hideAllPnIDPopups()
{
    if (currentPnID == undefined)
    {
        //if the current pnid is undefined, there's nothing we can do
        return;
    }
    if (currentPnID != undefined && activePopups[currentPnID] != undefined)
    {
        for (popup of Object.keys(activePopups[currentPnID]))
        {
            hidePopup(popup);
        }
    }
}

function getPopupConfig(popupID, stateType, parentClasses)
{
    let popupConfig = getConfigData(config, popupID, "popup");
    if (popupConfig == undefined)
    {
        //if no config was found in the custom config, check the default config
        if (stateType == StateTypes.actionReference)
        {
            popupConfig = getConfigData(defaultConfig, popupID, "popup");
        }
        else
        {
            popupConfig = getConfigData(defaultConfig, getTypeFromClasses(parentClasses), "popup");
        }
    }
    return popupConfig;
}

function editStoredPopupData(popupID, key, value, pnid = undefined)
{
    let pnidToEdit = currentPnID;
    if (pnid != undefined)
    {
        pnidToEdit = pnid;
    }
    try
    {
        let storedPopupsData = JSON.parse(window.localStorage.getItem("popups"));
        storedPopupsData[pnidToEdit][popupID][key] = value;
        window.localStorage.setItem("popups", JSON.stringify(storedPopupsData));
    }
    catch (error)
    {
        //probably the popup doesn't exist in local storage. this should never happen though
        printLog("error", `Tried editing the local storage entry of a popup that doesn't exist there: Popup "${popupID}" in ${pnidToEdit} at key ${key}`)
    }
}

function readStoredPopupData(popupID, key, pnid = undefined)
{
    let pnidToEdit = currentPnID;
    if (pnid != undefined)
    {
        pnidToEdit = pnid;
    }
    try
    {
        let storedPopupsData = JSON.parse(window.localStorage.getItem("popups"));
        return storedPopupsData[pnidToEdit][popupID][key];
    }
    catch (error)
    {
        //probably the popup doesn't exist in local storage. this should never happen though
        printLog("error", `Tried reading the local storage entry of a popup that doesn't exist there: Popup "${popupID}" in ${pnidToEdit} at key ${key}`)
    }
}

function restorePopupsFromLocalStorage()
{
    //I dislike having to iterate through every key in local storage to find popups
    //but maintaining a separate key with an array of popups in local storage sucks even more.
    //I could be using the activePopups dict, but that also contains closed popups and I only
    //want to store visible popups in the local storage and maintaining a second dict just with
    //active popups sounds like an even worse time
    let storedPopupsString = window.localStorage.getItem("popups");
    if (storedPopupsString == null || storedPopupsString.length == 0)
    {
        return;
    }
    let storedPopups = JSON.parse(storedPopupsString)[currentPnID];

    if (storedPopups == undefined)
    {
        return;
    }

    for (let popupID of Object.keys(storedPopups)) {
        let popupData = storedPopups[popupID];
        let parent = undefined;
        if (storedPopups[popupID]["stateType"] == StateTypes.actionReference.toString())
        {
            parent = $(document).find(`g[data-action-reference='${popupID}']`);
        }
        else
        {
            parent = $(document).find(`.${popupData["parentRef"]}.${popupData["parentValRef"]}`);
        }
        //console.log("create popup with", popupID, popupData["x"], popupData["y"], popupData["width"],popupData["height"]);
        if (parent.length > 0)
        {
            //todo I dislike that I have this rather long visibility check doubled here and in the click event listener
            if (popupID in activePopups && activePopups[currentPnID][popupID]["visibility"] == true) // if already exists and visible, highlight
            {
                activePopups[currentPnID][popupID]["popup"].css({"animation-name": "none"});
                setTimeout( function() {
                    activePopups[currentPnID][popupID]["popup"].css({"animation-name": "highlight", "animation-duration": "2s"});
                }, 100);
            }
            else // if doesn't exist, create, if just hidden, show
            {
                if (activePopups[currentPnID] != undefined && popupID in activePopups[currentPnID]) //just hidden, no need to create again
                {
                    //console.log("restoring popup", popupID);
                    activePopups[currentPnID][popupID]["popup"].fadeIn(100);
                    activePopups[currentPnID][popupID]["visibility"] = true;
                }
                else
                {
                    //console.log("creating popup", popupID, parent);
                    createPopup(
                        popupID,
                        parent,
                        popupData["stateType"] == StateTypes.sensor.toString() ? StateTypes.sensor : StateTypes.actionReference,
                        popupData["x"],
                        popupData["y"],
                        popupData["width"],
                        popupData["height"]
                    );
                }
            }
        }
    }
}

function storePopupInLocalStorage(popupID, parentRef, parentValRef, stateType, popupPosition, popupSize)
{
    let curPopupDataStore = {
        parentRef: parentRef,
        parentValRef: parentValRef,
        stateType: stateType.toString(),
        x: popupPosition[0],
        y: popupPosition[1],
        width: popupSize[0],
        height: popupSize[1]
    };
    console.log("storing popup data", curPopupDataStore);
    let storedPopupsString = window.localStorage.getItem("popups");
    let storedPopups = {};
    if (storedPopupsString != null && storedPopupsString.length > 0)
    {
        //todo this doesn't properly handle if the popup string somehow isn't a valid JSON string. should probably fall back to clearing the popups localstorage in that case
        storedPopups = JSON.parse(storedPopupsString);
    }
    if (storedPopups[currentPnID] == undefined)
    {
        storedPopups[currentPnID] = {
            [popupID]: curPopupDataStore
        };
    }
    else
    {
        storedPopups[currentPnID][popupID] = curPopupDataStore;
    }
    console.log("stored popups", storedPopups);
    console.log("popups stringified", JSON.stringify(storedPopups));
    //add popup to localstorage
    window.localStorage.setItem("popups", JSON.stringify(storedPopups));
}

function removePopupFromLocalStorage(popupID, pnid = undefined)
{
    let storedPopupsString = window.localStorage.getItem("popups");
    if (storedPopupsString.length == 0)
    {
        //if there are no popups stored, we don't need to remove anything
        return;
    }
    let storedPopups = JSON.parse(storedPopupsString);
    delete storedPopups[pnid == undefined ? currentPnID : pnid][popupID];
    window.localStorage.setItem("popups", JSON.stringify(storedPopups));
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
    if (grafanaPanelConfig[source] != undefined)
    {
        customSource = grafanaPanelConfig[source];
        source = undefined;
    }
    else if (customConfig != undefined)
    {
        if (grafanaPanelConfig[customConfig["source"]] != undefined)
        {
            customSource = grafanaPanelConfig[customConfig["source"]];
        }
    }
    else if (grafanaPanelConfig[popupID] != undefined)
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
    if (config["source"] != undefined)
    {
        try
        {
            let url = new URL(config["source"]);
            //if this is not a fully qualified domain we want to use the source param given to us. todo: I hate this, refactor the entire behavior with the source parameter
            source = config["source"];
        }
        catch
        {
            //js wants a catch
        }
    }
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

function appendPopupContent(popup, popupConfig, popupID, stateType)
{
    //all states contained in a popup which may need updating
    let containedStates = [];

    //construct popup content
    for (contentIndex in popupConfig)
    {
        //this variable loading doesn't support elements with other variables
        let curValue = 0;
        let curRawValue = 0;
        if (stateType == StateTypes.actionReference) // if it is action reference, load the values from there instead of the normal pnid values
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

/**
 * @summary Calculates a sensible default position of a popup based on its parent element and the positioning within the viewport.
 * @param {Object} parents DOM Element of the parents.
 * @param {number} minPopupPad Padding from viewport boundaries with values 0 ... 1 being 0% ... 100%
 * @param {number} popupDistance Distance from parent element in px
 * @returns {Array} Array of x and y position at index 0 and 1 respectively
 */
function calcPopupPosition(parents, popupSize, minPopupPad = 0.02, popupDistance = 10)
{
    let viewportSize = [Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0), Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)];
	let parentPosition = parents.offset();

    popupPosition = [parentPosition.left, parentPosition.top + parents[0].getBoundingClientRect().height + popupDistance];
    if (parentPosition.top + popupSize[1] > viewportSize[1] * (1 - minPopupPad))
    {
        //popupPosition[1] = viewportSize[1] * (1 - minPopupPad) - popupSize[1];
        //popupPosition[1] = parentPosition.top - popupSize[1] - popupDistance;
    }
    if (parentPosition.left + popupSize[0] > viewportSize[0] * (1 - minPopupPad))
    {
        popupPosition[0] = viewportSize[0] * (1 - minPopupPad) - popupSize[0];
    }
    return popupPosition;
}

function createPopupTitleBar(popupClone, popupID, title)
{
	// I'd like to not have to have the width and height specified here, but when it's in the .css it
    //gets ignored unless written with !important because the style here is more specific
    popupClone.attr('style', `width: auto; height: auto;`);
	
    popupClone.find("div.popup-heading").first().text(title);
	popupClone.find("div.row").find(".btn-close").first().on('click', function(){destroyPopup(popupID);});
	popupClone.find("div.row").find(".btn-drag").first().on('mousedown', function(e) {
		isDown = true;
		target = popupClone[0];
		offset = [
			popupClone[0].offsetLeft - e.clientX,
			popupClone[0].offsetTop - e.clientY
		];
	});
    return popupClone;
}

function createBundledElements(popup, parents)
{
    let appendedElements = false;
    parents.each(function(index) {
        let parentReference = getValReferenceFromClasses(extractClasses(parents.eq(index).attr("class")));
        let parentType = getTypeFromClasses(extractClasses(parents.eq(index).attr("class")));
        let popupConfig = getConfigData(defaultConfig, parentType, "popup");
        if (appendedElements == false && popupConfig != undefined)
        {
            //Only append the "bundled elements" sub header to a popup if there actually are elements to bundle
            //todo: this is currently (almost) useless because if there's no popup definition you can't open a popup from that element
            //this should however be remedied in the future
            appendedElements = true;
            popup.append(createSeparator());
            popup.append(createTextDisplay("none", "Bundled PnID element inputs:")); //at some point change this to another element, possibly a collapsible element
        }
        appendPopupContent(popup, popupConfig, parentReference, StateTypes.sensor);
    });
}

//TODO consider breaking into several smaller functions
function createPopup(popupID, parent, stateType, x = undefined, y = undefined, width = undefined, height = undefined)
{
    console.log("creating popup with id", popupID, "and state type", stateType);
    //printLog("info", parent);
	
	let popupClone = $("#popupTemp").clone();
	popupClone.removeAttr('id');
	
	let parentClasses = extractClasses(parent.attr("class"));
	let title = "";
	if (stateType == StateTypes.actionReference) //if popup is for action reference, set name of action reference as title. TODO this is not really a human readable name, add a feature (how?) to get human readable action references
	{
	    title = popupID;
	}
	else
	{
        //console.log("parent classes:", parentClasses, "val ref:", getValReferenceFromClasses(parentClasses));
	    title = getElementValue(getValReferenceFromClasses(parentClasses), "reference");
	}
	popupClone = createPopupTitleBar(popupClone, popupID, title);

    let popupConfig = getPopupConfig(popupID, stateType, parentClasses);
    if (popupConfig == undefined)
    {
        printLog("warning", `Tried creating a popup from ID "${popupID}", but no popup configuration was found.`); //does this make sense to print? this can be 100% wanted/intended to be the case
        return;
    }

    let containedStates = appendPopupContent(popupClone, popupConfig, popupID, stateType);

    if (stateType == StateTypes.actionReference) //if it is an action reference, append all pnid elements' popup content rows to the current popup TODO Consider whether this should be toggleable behind a config flag
    //TODO if it should have a config flag, every part where I update needs to check this flag to not create bugs. eg: update popup for updating bundled states in action reference popups
    {
        createBundledElements(popupClone, parent);
    }

    if (width != undefined && height != undefined)
    {
        //todo this may have unwanted behavior if only one of the two is undefined
        if (popupClone.style == undefined)
        {
            popupClone.style = "";
        }
        popupClone.width(width);
        popupClone.height(height);
    }
    let popupPosition = [0,0];
    if (x == undefined || y == undefined)
    {
        let popupSize = [popupClone.outerWidth(), popupClone.outerHeight()];
        popupPosition = calcPopupPosition(parent, popupSize);
    }
    else
    {
        popupPosition = [x, y];
    }
    
    popupClone.css("top", popupPosition[1]+"px");
    popupClone.css("left", popupPosition[0]+"px");

    popupClone.attr("data-popup-id", popupID);
    $(document.body).append(popupClone);
	popupClone.fadeIn(100);
    
    if (currentPnID != undefined)
    {
        if (activePopups[currentPnID] == undefined)
        {
            activePopups[currentPnID] = {};
        }
        activePopups[currentPnID][popupID] = {
            "popup": popupClone,
            "stateType": stateType,
            "parentRef": getReferenceFromClasses(parentClasses),
            "parentValRef": stateType == StateTypes.actionReference ? popupID : getValReferenceFromClasses(parentClasses),
            "config": popupConfig,
            "containedStates": containedStates,
            "visibility": true
        };
        
        storePopupInLocalStorage(popupID, getReferenceFromClasses(parentClasses), getValReferenceFromClasses(parentClasses), stateType, popupPosition, [popupClone.outerWidth(), popupClone.outerHeight()]);
    }

    //let resize observer watch for this popup
    resizeObserver.observe(popupClone.get(0));

}

function updatePopupTitle(popupID, newTitle)
{
    if (popupID in activePopups)
    {
        activePopups[popupID]["popup"].find("div.popup-heading").first().text(newTitle);
    }
}

function updatePopupsFromContainedStates(stateName, valueRaw, stateType)
{
    if (currentPnID == undefined || activePopups[currentPnID] == undefined)
    {
        printLog("error", `Tried updating a popup for possibly contained state ${stateName}, but either no pnid is defined or no popups at that pnid (PnID: ${currentPnID}, Popups for PnID: ${activePopups[currentPnID]})`);
        return;
    }
    for (let i in activePopups[currentPnID])
    {
        for (let n in activePopups[currentPnID][i]["containedStates"])
        {
            if (activePopups[currentPnID][i]["containedStates"][n] == stateName)
            {
                //console.log("trying to update contained state", state["name"], isGuiState, isActionReference, i);
                updatePopup(stateName, valueRaw, stateType, i);
            }
        }
    }
}

function findPopupWithState(stateName)
{
    //todo: I dislike that I have to return an array here (not particularly about the array, but I dislike that I need to return 2 pieces of information)
    let bundledInActionReference = false; //I know that I don't really need that variable, but it makes the code more readable IMO
    if (currentPnID != undefined && activePopups[currentPnID] != undefined)
    {
        if (stateName in activePopups[currentPnID])
        {
            return [stateName, bundledInActionReference];
        }
    
        let actionReference = getElementAttrValue(stateName, "data-action-reference");
        if (actionReference in actionReference[currentPnID])
        {
            bundledInActionReference = true;
            return [actionReference, bundledInActionReference];
        }
        //todo I feel like I should also check for bundled states here, but for some reason the old code also had bundled states working here?
    }
    else
    {
        printLog("error", `Tried finding a popup for the state ${stateName}, but either no pnid is defined or no popups at that pnid (PnID: ${currentPnID}, Popups for PnID: ${activePopups[currentPnID]})`);
        return [undefined, false];
    }
}

function updatePopup(stateName, value, stateType, popupID = undefined)
{
    if (currentPnID == undefined || activePopups[currentPnID] == undefined)
    {
        printLog("error", `Tried updating a popup for state ${stateName}, but either no pnid is defined or no popups at that pnid (PnID: ${currentPnID}, Popups for PnID: ${activePopups[currentPnID]})`);
        return;
    }

    let bundledInActionReference = false;
    if (popupID == undefined)
    {
        [popupID, bundledInActionReference] = findPopupWithState(stateName);
    }

    let popup = activePopups[currentPnID][popupID]["popup"];
    let popupConfig = activePopups[currentPnID][popupID]["config"];

    if (bundledInActionReference)
    {
        //todo: popup creation now respects custom config for popups as well, this does not (yet). fix.
        popupConfig = getConfigData(defaultConfig, getTypeFromClasses(extractClasses(getElement(stateName).first().attr("class"))), "popup");
        if (popupConfig == undefined) //if this bundled state has no popup config it also can't have a bundled element in the action reference popup, so there is nothing to update
        {
            return;
        }
    }

    for (let rowConfig of popupConfig)
    {
        //only update this popup row if it's the right variable for it
        //console.log("updating rowconfig", rowConfig, stateName, popupID);
        if (stateName == rowConfig["variable"] || (stateName == popupID && rowConfig["variable"] == "value"))
        {
            switch (stateType)
            {
                //I'm not too happy with the split here as I need to go through the same
                case StateTypes.sensor:
                    updatePopupSensorState(stateName, value, popup, rowConfig);
                    console.log("updating popup from sensor state type:", stateName, value);
                    break;
                case StateTypes.guiEcho:
                    updatePopupGuiEchoState(stateName, value, popup, rowConfig);
                    console.log("updating popup from gui echo state type:", stateName, value);
                    break;
                case StateTypes.actionReference:
                    updatePopupActionReferenceState(stateName, value, popup, rowConfig);
                    console.log("updating popup from action reference state type:", stateName, value);
                    break;
                case StateTypes.setState:
                    updatePopupSetStateState(stateName, value, popup, rowConfig);
                    console.log("updating popup from set state state type:", stateName, value);
                    break;
            }
        }
    }
}

function updatePopupSensorState(stateName, value, popup, rowConfig)
{
    let contentType = rowConfig["type"];
    let contentStyle = rowConfig["style"];
    let elements = {};
    switch (contentType)
    {
        case "display":
            switch (contentStyle)
            {
                case "text":
                    elements = $(popup).find(`[display="${stateName}"]`);
                    elements.text(value);
                    break;
                case "external": //no update needed
                    break;
                default:
                    printLog("warning", `Unknown display style while trying to update popup (${popupID}) with state (${stateName}): '${contentStyle}'`);
                    break;
            }
            break;
        case "input":
            switch (contentStyle)
            {
                case "checkbox":
                    break;
                case "slider":
                    //if the value is sensor feedback, update the feedback slider background
                    if (!checkStringIsNumber(rawValue)) //not really needed anymore now that there is global input validation (right when states come in value is checked for being a number)
                    {
                        printLog("warning", `Encountered state value that isn't a number while updating <code>'${popupID}'</code> popup with state <code>'${stateName}'</code>: ${rawValue}. Ignoring update.`);
                        break;
                    }
                    setSliderFeedback(elements, Math.round(rawValue))
                    break;
                case "numberEntry":
                    //todo: right now number entry is never used to manipulate a pnid element/sensor/actuator directly, so the sensor state type doesn't do anything, but that may need to change in the future.
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

function updatePopupGuiEchoState(stateName, value, popup, rowConfig)
{
    //todo: all input elements should have a similar behaviour to number entry where uncommitted changes are marked in red
    let contentType = rowConfig["type"];
    let contentStyle = rowConfig["style"];
    let elements = {};
    //only update this popup row if it's the right variable for it
    //console.log("updating rowconfig", rowConfig, stateName, popupID);
    switch (contentType)
    {
        case "display":
            switch (contentStyle)
            {
                case "text":
                    //TODO consider adding the ability for text displays to show other types of state updates
                    break;
                case "external": //no update needed
                    break;
                default:
                    printLog("warning", `Unknown display style while trying to update popup (${popupID}) with state (${stateName}): '${contentStyle}'`);
                    break;
            }
            break;
        case "input":
            switch (contentStyle)
            {
                case "checkbox":
                    //console.log("updating gui state checkbox", rawValue);
                    //if the value is the echoed setpoint, update the input, if it's the sensor feedback value don't
                    //todo: ask markus/georg; do we want this update on gui echo or on set state?
                    elements = $(popup).find(`input#${stateName}[type=checkbox]`);
                    if (value.toString() === rowConfig["low"])
                    {
                        elements.prop("checked", false);
                    }
                    else
                    {
                        elements.prop("checked", true);
                    }
                    break;
                case "slider":
                    elements = $(popup).find(`input.range-slider__range[state=${stateName}][type=range]`);
                    //if the value is not sensor feedback, but a set point instead, move the slider
                    if (!sliderIsMoving())
                    {
                        //but only if the slider isn't being moved right now
                        setSliderValue(elements, Math.round(value));
                    }
                    break;
                case "numberEntry":
                    //console.log("updating number entry");
                    //todo: I kinda dislike that I'm using the placeholder for checking the variable but it's the easiest I can do rn
                    elements = $(popup).find("input[type=number]").filter(`[placeholder=${stateName}]`);
                    elements.val(value);
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

function updatePopupActionReferenceState(stateName, value, popup, rowConfig)
{
    let contentType = rowConfig["type"];
    let contentStyle = rowConfig["style"];
    let elements = {};
    switch (contentType)
    {
        case "display":
            switch (contentStyle)
            {
                case "text":
                    //TODO consider adding the ability for text displays to show other types of state updates
                    break;
                case "external": //no update needed
                    break;
                default:
                    printLog("warning", `Unknown display style while trying to update popup (${popupID}) with state (${stateName}): '${contentStyle}'`);
                    break;
            }
            break;
        case "input":
            switch (contentStyle)
            {
                case "checkbox":
                    if (stateType == StateTypes.actionReference)
                    {
                        //console.log("updating gui state checkbox", rawValue);
                        //if the value is the echoed setpoint, update the input, if it's the sensor feedback value don't
                        //todo: this is duplicated code from gui echo and here. do I need it at both locations? is it guaranteed to stay the same?
                        elements = $(popup).find(`input#${stateName}[type=checkbox]`);
                        if (value.toString() === rowConfig["low"])
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
                    //if the value is sensor feedback, update the feedback slider background
                    if (!checkStringIsNumber(value)) //not really needed anymore now that there is global input validation (right when states come in value is checked for being a number)
                    {
                        printLog("warning", `Encountered state value that isn't a number while updating <code>'${popupID}'</code> popup with state <code>'${stateName}'</code>: ${value}. Ignoring update.`);
                        break;
                    }
                    setSliderFeedback(elements, Math.round(value));
                    break;
                case "numberEntry":
                    //todo: right now number entry is never used to manipulate an action reference, so the sensor state type doesn't do anything, but that may need to change in the future.
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

//I hate this function name but it fits the scheme and I don't know anything better
function updatePopupSetStateState(stateName, value, popup, rowConfig)
{
    let contentType = rowConfig["type"];
    let contentStyle = rowConfig["style"];
    let elements = {};
    switch (contentType)
    {
        case "display":
            switch (contentStyle)
            {
                case "text":
                    //TODO consider adding the ability for text displays to show other types of state updates
                    break;
                case "external": //no update needed
                    break;
                default:
                    printLog("warning", `Unknown display style while trying to update popup (${popupID}) with state (${stateName}): '${contentStyle}'`);
                    break;
            }
            break;
        case "input":
            switch (contentStyle)
            {
                case "checkbox":
                    break;
                case "slider":
                    break;
                case "numberEntry":
                    //console.log("updating number entry");
                    //todo: I kinda dislike that I'm using the placeholder for checking the variable but it's the easiest I can do rn
                    elements = $(popup).find("input[type=number]").filter(`[placeholder=${stateName}]`);
                    elements.val(value);
                    elements.siblings().find("input.form-control").removeClass("uncommitted-highlight");
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

function updatePopup_old(stateName, value, rawValue, stateType, popupID = undefined)
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
            let actionReference = getElementAttrValue(stateName, "data-action-reference");
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
                            if (stateType == StateTypes.sensor)
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
                    switch (contentStyle)
                    {
                        case "checkbox":
                            if (stateType == StateTypes.guiEcho || stateType == StateTypes.actionReference)
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
                            if (stateType != StateTypes.guiEcho)
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
                            if (stateType == StateTypes.guiEcho)
                            {
                                elements.val(rawValue);
                            }
                            if (stateType == StateTypes.setState)
                            {
                                elements.siblings().find("input.form-control").removeClass("uncommitted-highlight");
                            }
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

function highlightPopup(popupID)
{
    activePopups[popupID]["popup"].css({"animation-name": "none"});
    setTimeout( function() {
        activePopups[popupID]["popup"].css({"animation-name": "highlight", "animation-duration": "2s"});
    }, 100);
}

function hidePopup(popupID)
{
    //console.log("hiding popup", popupID, currentPnID);
    let cacheCurrentPnID = currentPnID;
    $(activePopups[cacheCurrentPnID][popupID]["popup"]).fadeOut(200, function() {
        activePopups[cacheCurrentPnID][popupID]["visibility"] = false;
    });
}

function unhidePopup(popupID)
{
    //console.log("unhiding popup", popupID, currentPnID);
    activePopups[currentPnID][popupID]["popup"].fadeIn(100);
    activePopups[currentPnID][popupID]["visibility"] = true;
    storePopupInLocalStorage(
        popupID,
        activePopups[currentPnID][popupID]["parentRef"],
        activePopups[currentPnID][popupID]["parentValRef"],
        activePopups[currentPnID][popupID]["stateType"],
        [
            activePopups[currentPnID][popupID]["popup"][0].offsetLeft,
            activePopups[currentPnID][popupID]["popup"][0].offsetTop
        ],
        [
            activePopups[currentPnID][popupID]["popup"].outerWidth(), 
            activePopups[currentPnID][popupID]["popup"].outerHeight()
        ]
    );
}

function destroyPopup(popupID)
{
    hidePopup(popupID);
    removePopupFromLocalStorage(popupID);
}

function clearPopupStorage()
{
    window.localStorage.setItem("popups", "");
}

var mousePosition;
var offset = [0,0];
var target;
var isDown = false;

document.addEventListener('mouseup', function(event) {
    isDown = false;
    if (popupMoved.length > 0)
    {
        try
        {
            //console.log(`popup moved: '${popupMoved}', ${popupMoved.length}`);
            editStoredPopupData(popupMoved, "x", target.offsetLeft);
            editStoredPopupData(popupMoved, "y", target.offsetTop);
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
    if (popupResized.length > 0)
    {
        //unfortunately resize events work differently so I can't use target here
        try
        {
            if (activePopups[currentPnID][popupResized]["visibility"] == true)
            {
                //apparently resize also gets triggered if visibility is set to hidden which breaks the following code (we don't even want that)
                editStoredPopupData(popupResized, "width", activePopups[currentPnID][popupResized]["popup"].outerWidth());
                editStoredPopupData(popupResized, "height", activePopups[currentPnID][popupResized]["popup"].outerHeight());
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
        if ($(entry.target).is(":visible"))
        {
            //resize event also triggers on show/hide. can lead to errors if we switch pnid so
            //we filter out popups that aren't visible as those are on another pnid
            //might bite me in the ass at some point in the future if this happens somewhere else
            popupResized = entry.target.dataset.popupId;
        }
    }
});

//I think this segment below is obsolete, but I'll keep it around a bit longer in case I just didn't notice what it did.
//If you read this and have no idea what I'm talking about, delete the commented out event listener
/*document.addEventListener('onresize', function(event) {
    console.log("resize");
    popupResized = target.dataset.popupId;
}, true);*/

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