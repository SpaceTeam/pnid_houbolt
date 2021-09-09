var activePopups = {};

//popup ID is the GUI ID (action_reference in kicad)
function clickEventListener(popupID)
{
    // check if popup already exists
    if (popupID in activePopups) // if already exists, highlight
	{ 
	    printLog("info", popupID);
		activePopups[popupID].css({"animation-name": "none"});
		setTimeout( function() {
		    activePopups[popupName].css({"animation-name": "highlight", "animation-duration": "2s"});
		}, 100);
	}
	else // if doesn't exist, create
	{
	    popupParent = $(document).find(`g[action-reference=${popupID}]`).first();
		createPopup(popupID, popupParent);
	}
}

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
    popupClone.find("div.popup-heading").first().text(title); //this needs to change to load the human readable/nice name (pass it on to the function? kind of dislike that)

    let type = getTypeFromClasses(parentClasses);
    if (popupID in defaultConfig) // indicates a custom action reference that wants/needs its own popup definition
    {
        type = popupID;
    }
    
    if (!("popup" in defaultConfig[type])) // check if there actually is a popup definition
    {
        printLog("warning", `Tried creating a popup from ID "${popupID}" with type "${type}", but no popup configuration was found.`);
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
                        printLog("warning", `Unknown display style for popup encountered in config: '${contentStyle}'`);
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
                            printLog("error", `Encountered a value that doesn't correspond to either high (${highThreshold}) or low (${lowThreshold}) value for popup display: '${curValue}'! Defaulting to unchecked.`);
                            newContentRow.find("input").prop("checked", false);
                        }
                        break;
                    case "slider":
                        printLog("info", "test");
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
                        printLog("warning", `Unknown input style for popup encountered in config: '${contentStyle}'`);
                        break;
                }
                break;
        }
        popupClone.append(newContentRow);
    }

    $(document.body).append(popupClone);
	popupClone.fadeIn(100);
    
	/*activePopups[popupID] = {
	    "popup": popupClone,
	    
	};*/
	activePopups[popupID] = popupClone;
}

function updatePopup(popupID, value, rawValue)
{

}

function destroyPopup(popupID)
{
    $(activePopups[popupID]).fadeOut(100, function() {
        activePopups[popupID].remove();
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
