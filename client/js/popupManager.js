var activePopups = {};

//popup ID is the GUI ID (action_reference in kicad)
function clickEventListener(popupID)
{
    // check if popup already exists
    if (popupID in activePopups) // if already exists, highlight
	{ 
	    printLog("info", popupID);
		activePopups[popupID]["popup"].css({"animation-name": "none"});
		setTimeout( function() {
		    activePopups[popupID]["popup"].css({"animation-name": "highlight", "animation-duration": "2s"});
		}, 100);
	}
	else // if doesn't exist, create
	{
	    popupParent = $(document).find(`g[action-reference='${popupID}']`);
		createPopup(popupID, popupParent);
	}
}

//TODO consider breaking into several smaller functions
function createPopup(popupID, parent)
{
	let parentPosition = parent.offset();
	
	let popupClone = $("#popupTemp").clone();
	popupClone.removeAttr('id');
	// I'd like to not have to have the width and height specified here, but when it's in the .css it gets ignored unless written with !important because the style here is more specific
	popupClone.attr('style', `width: auto; height: auto; top: ` + parentPosition.top + `px; left: ` + (parentPosition.left + parent[0].getBoundingClientRect().width / 2.0) + `px;`);
	
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
	let title = getReferenceFromClasses(parentClasses);
	if (parentClasses.length != 1) //if there isn't exactly one parent (which can occur if the popup is bound to a custom action reference instead of a pnid element), set name of action reference as title. TODO this is not really a human readable name, add a feature (how?) to get human readable action references
	{
	    title = popupID;
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
    
    if (!("popup" in defaultConfig[type])) // check if there actually is a popup definition
    {
        printLog("warning", `Tried creating a popup from ID "${popupID}" with type "${type}", but no popup configuration was found.`); //does this make sense to print? this can be 100% wanted/intended to be the case
        return;
    }
    let popupConfig = defaultConfig[type]["popup"];
    

    //construct popup popup
    for (contentIndex in popupConfig)
    {
        let curValue = getElementValue(getValReferenceFromClasses(parentClasses), false);
        let curRawValue = getElementValue(getValReferenceFromClasses(parentClasses), true)
        let contentType = popupConfig[contentIndex]["type"];
        let contentStyle = popupConfig[contentIndex]["style"];
        let variableName = popupConfig[contentIndex]["variable"];
        if (variableName === "value")
        {
            variableName = popupID;
        }
        let newContentRow;
        switch (contentType)
        {
            case "display":
                switch (contentStyle)
                {
                    case "text":
                        newContentRow = $("#textDisplayTemp").clone();
                        newContentRow.removeAttr("id");
                        newContentRow.find(".popup-value-out").attr("display", popupID);
                        newContentRow.find(".popup-value-out").text(curValue);
                        break;
                    case "external":
                        printLog("warning", "Style 'external' not yet implemented for display styles in popups");
                        break;
                    default:
                        printLog("warning", `Unknown display style for popup (${popupID}) encountered in config: '${contentStyle}'`);
                        break;
                }
                break;
            case "input":
                switch (contentStyle)
                {
                    case "checkbox":
                        newContentRow = $("#digitalOutTemp").clone();
                        newContentRow.removeAttr("id");
                        newContentRow.find(".ckbx-label").text(variableName).attr("for", popupID);
                        newContentRow.find("input").attr('id', popupID).attr('state', variableName);
                        
                        let highThreshold = defaultConfig[type]["popup"][contentIndex]["high"];
                        let lowThreshold = defaultConfig[type]["popup"][contentIndex]["low"];
                        if (curValue === highThreshold)
                        {
                            newContentRow.find("input").prop("checked", true);
                        }
                        else if (curValue === lowThreshold)
                        {
                            newContentRow.find("input").prop("checked", false);
                        }
                        else
                        {
                            printLog("error", `Encountered a value that doesn't correspond to either high (${highThreshold}) or low (${lowThreshold}) value for popup (${popupID}) display: '${curValue}'! Defaulting to unchecked.`);
                            newContentRow.find("input").prop("checked", false);
                        }
                        break;
                    case "slider":
                        newContentRow = $("#sliderTemp").clone();
                        newContentRow.removeAttr("id");
                        newContentRow.find(".range-slider-label").text(name);
                        if (!checkStringIsNumber(curRawValue)) //not really needed anymore now that there is global input validation (right when states come in value is checked for being a number)
                        {
                            printLog("warning", `Encountered state value that isn't a number while creating <code>${popupID}</code> popup: ${curRawValue}. Defaulting to '0'.`);
                            curRawValue = 0;
                        }
                        newContentRow.find("input").first().attr("value", Math.round(curRawValue)).attr("state", variableName);
                        newContentRow.find(".range-slider__feedback").text(Math.round(curRawValue));
                        break;
                    case "textEntry":
                        printLog("warning", "Style 'textEntry' not yet implemented for input styles in popups");
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
        popupClone.append(newContentRow);
    }

    $(document.body).append(popupClone);
	popupClone.fadeIn(100);
    
	activePopups[popupID] = {
	    "popup": popupClone,
	    "config": popupConfig
	};
}

function updatePopup(popupID, value, rawValue)
{
    if (!(popupID in activePopups)) //if popup doesn't exist, don't update it
    {
        return;
    }
    let popup = activePopups[popupID]["popup"];
    let popupConfig = activePopups[popupID]["config"];
    
    for (contentIndex in popupConfig)
    {
        let contentType = popupConfig[contentIndex]["type"];
        let contentStyle = popupConfig[contentIndex]["style"];
        let elements = {};
        switch (contentType)
        {
            case "display":
                switch (contentStyle)
                {
                    case "text":
                        elements = $(popup).find(`[display="${popupID}"]`);
                        elements.text(value);
                        break;
                    case "external":
                        printLog("warning", "Wanted to update style 'external' in a popup, but it is not yet implemented for display styles");
                        break;
                    default:
                        printLog("warning", `Unknown display style while trying to update popup (${popupID}): '${contentStyle}'`);
                        break;
                }
                break;
            case "input":
                switch (contentStyle)
                {
                    case "checkbox":
                        elements = $(popup).find(`input#${popupID}[type=checkbox]`);
                        if (value === popupConfig[contentIndex]["low"])
                        {
                            elements.prop("checked", false);
                        }
                        else
                        {
                            elements.prop("checked", true);
                        }
                        break;
                    case "slider":
                        elements = $(popup).find(`input.range-slider__range[state=${popupID}][type=range]`);
                        if (!checkStringIsNumber(rawValue)) //not really needed anymore now that there is global input validation (right when states come in value is checked for being a number)
                        {
                            printLog("warning", `Encountered state value that isn't a number while updating <code>'${popupID}'</code> popup: ${rawValue}. Ignoring update.`);
                            break;
                        }
                        elements.val(Math.round(rawValue));
                        let feedback = elements.siblings("span.range-slider__feedback");
                        feedback.text(Math.round(rawValue));
                        let valueOut = elements.siblings("span.range-slider__value");
                        valueOut.text(Math.round(rawValue));
                        break;
                    default:
                        printLog("warning", `Unknown input style while trying to update popup (${popupID}): '${contentStyle}'`);
                        break;
                }
                break;
            default:
                printLog("warning", `Unknown content type while trying to update popup (${popupID}): '${contentType}'`);
                break;
        }
    }
}

function destroyPopup(popupID)
{
    $(activePopups[popupID]["popup"]).fadeOut(100, function() {
        activePopups[popupID]["popup"].remove();
        delete activePopups[popupID];
    });
}

var mousePosition;
var offset = [0,0];
var target;
var isDown = false;

document.addEventListener('mouseup', function() {
    isDown = false;
	// target = undefined;
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
    }
}, true);
