var activePopups = {};

function clickEventListenever(dispReference, dispType, dispValReference)
{
	let popupName = dispType + "_" + dispValReference;
	if (!(popupName in activePopups)) //check if popup already exists
	{
		showPopup(dispReference, dispType, dispValReference);
	}
	else
	{
		printLog("info", popupName);
		activePopups[popupName].css({"animation-name": "none"});
		setTimeout(function(){activePopups[popupName].css({"animation-name": "highlight", "animation-duration": "2s"});}, 100)
		
	}
}

//choose popup behavior to display, hand off data to createPopup
function showPopup(dispReference, dispType, dispValReference)
{
	if (dispType in defaultConfig)
	{
		if ("popup" in defaultConfig[dispType])
		{
			popupParent = $(document).find("g." + dispReference + "." + dispType + "." + dispValReference);
			createPopup(popupParent, dispType, dispValReference);
		}
		
	}
}

//create the actual html elements for the popup
function createPopup(parent, type, name)
{
	let popupName = type + "_" + name;
	let parentPosition = parent.offset();
	//let parentPosition = parent.getBoundingClientRect();
	//printLog("info", parent);
	//printLog("info", "parentpos: " + parentPosition + " top: " + parentPosition.top + " left: " + parentPosition.left);
	//printLog("info", "parent width: " + parent[0].getBoundingClientRect().width);
	var popup = $(`<div style='width: auto; height: auto; position: absolute; top: ` + parentPosition.top + `px; left: ` +
	(parentPosition.left + parent[0].getBoundingClientRect().width / 2.0) + `px; display: none;' class="container-fluid popup"></div>`);
	$(document.body).append(popup);

	let headerClone = $("#headerTemp").clone();
	headerClone.removeAttr('id');
	headerClone.find(".btn-close").first().on('click', function(){destroyPopup(popupName);});
	headerClone.find(".btn-drag").first().on('mousedown', function(e) {
		isDown = true;
		target = popup[0];
		offset = [
			popup[0].offsetLeft - e.clientX,
			popup[0].offsetTop - e.clientY
		];
	});
    headerClone.find("div.popup-heading").first().text(name);
	popup.append(headerClone);

    //get popup config data
    let popupConfigContents = defaultConfig[type]["popup"];

    //construct popup popup
    for (contentIndex in popupConfigContents)
    {
        let classes = $(parent[0]).attr("class").split(" ");

        //I really dislike having this hardcoded to the 2nd entry in the classes, but it's the quickest and safest way to do it right now.
        let curValue = getElementValue(classes[2], false);
        let curRawValue = getElementValue(classes[2], true)
        let contentType = popupConfigContents[contentIndex]["type"];
        let variableName = popupConfigContents[contentIndex]["variable"];
        if (variableName === "value")
        {
            variableName = name;
        }
        switch (contentType)
        {
            case "display":
                let newValueDisplay;
                switch (popupConfigContents[contentIndex]["style"])
                {
                    case "text":
                        newValueDisplay = $("#textDisplayTemp").clone();
                        newValueDisplay.removeAttr("id");
                        newValueDisplay.find(".popup-value-out").attr("display", popupName);
                        newValueDisplay.find(".popup-value-out").text(curValue);
                        break;
                    case "graph":
                        break;
                    default:
                        printLog("warning", "Unknown display type for popup encountered in config: '" + popupConfigContents["style"] + "'");
                        break;
                }
                popup.append(newValueDisplay);
                break;
            case "checkbox":
                let newCheckbox = $("#digitalOutTemp").clone();
                newCheckbox.removeAttr("id");
                newCheckbox.find(".ckbx-label").text(name).attr("for", popupName);
                newCheckbox.find("input").attr('id', popupName);
                if (curValue === "Open")
                {
                    newCheckbox.find("input").prop("checked", true);
                }
                else if (curValue === "Closed")
                {
                    newCheckbox.find("input").prop("checked", false);
                }
                else
                {
                    newCheckbox.find("input").prop("checked", false);
                }
                popup.append(newCheckbox);
                break;
            case "slider":
                let newSlider = $("#sliderTemp").clone();
                newSlider.removeAttr("id");
                newSlider.find(".range-slider-label").first().text(name);
                //curRawValue needs checking for filtering out invalid values (non-number values)
                newSlider.find("input").first().attr("value", Math.round(curRawValue)).attr("for", variableName);
                newSlider.find(".range-slider__feedback").text(Math.round(curRawValue));
                popup.append(newSlider);
                break;
            default:
                printLog("warning", "Unknown content type for popup encountered in config: '" + contentType + "'");
        }
    }

	popup.fadeIn(100);

	rangeSlider();
	
	activePopups[popupName] = popup;
}

//if changes are made to an element while popup is open it might need to update values in the popup
function updatePopup(elementType, variableName, value, rawValue)
{
    let popupName = elementType + "_" + variableName;
    if (!(popupName in activePopups)) //if popup doesn't exist, don't update it
    {
        return;
    }
    let popup = activePopups[popupName];
    //--- updating "type": "display"
    //"style": "text"
    
    
    //--- updating "type": "checkbox"
    
    
    //--- updating "type": "slider"
    //elements = $(popup).find(`input#`);
    
    for (contentIndex in defaultConfig[elementType]["popup"])
    {
        let contentType = defaultConfig[elementType]["popup"][contentIndex]["type"];
        let elements = {};
        switch (contentType)
        {
            case "display":
                elements = $(popup).find(`[display="${popupName}"]`);
                elements.text(value);
                break;
            case "checkbox":
                elements = $(popup).find(`input#${popupName}[type=checkbox]`);
                if (value === defaultConfig[elementType]["popup"][contentIndex]["low"])
                {
                    elements.prop("checked", false);
                }
                else
                {
                    elements.prop("checked", true);
                }
                break;
            case "slider":
                sliders = $(popup).find(`input.range-slider__range[for=${variableName}][type=range]`);
                sliders.attr("value", Math.round(rawValue));
                let feedback = sliders.siblings("span.range-slider__feedback");
                feedback.text(Math.round(rawValue));
                let valueOut = sliders.siblings("span.range-slider__value");
                valueOut.text(Math.round(rawValue));
                break;
            default:
                printLog("warning", "Tried updating popup with unknown content type for popup encountered in config: '" + contentType + "'");
        }
    }
}

function destroyPopup(popupName)
{
    $(activePopups[popupName]).fadeOut(100, function() {
        activePopups[popupName].remove();
        delete activePopups[popupName];
    });
}

var mousePosition;
var offset = [0,0];
var target;
var isDown = false;

// div.addEventListener('mousedown', function(e) {
//     isDown = true;
//     offset = [
//         div.offsetLeft - e.clientX,
//         div.offsetTop - e.clientY
//     ];
// }, true);

document.addEventListener('mouseup', function() {
    isDown = false;
	// target = undefined;
}, true);

document.addEventListener('mousemove', function(event) {
    // event.preventDefault();
	
    if (isDown) {
		printLog("info", "here");
        mousePosition = {

            x : event.clientX,
            y : event.clientY

        };
        target.style.left = (mousePosition.x + offset[0]) + 'px';
        target.style.top  = (mousePosition.y + offset[1]) + 'px';
    }
}, true);
