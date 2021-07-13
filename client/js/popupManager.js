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
		console.log(popupName);
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
			popupData = defaultConfig[dispType]["popup"].split(":"); //todo: this supports only one item per popup, need to expand with a line/item delimiter
			popupParent = $(document).find("g." + dispReference + "." + dispType + "." + dispValReference);
			createPopup(popupParent, dispType, dispValReference, popupData);
		}
		
	}
}

//create the actual html elements for the popup
function createPopup(parent, type, name, contentList)
{
	let popupName = type + "_" + name;
	let parentPosition = parent.offset();
	//let parentPosition = parent.getBoundingClientRect();
	//console.log(parent);
	//console.log("parentpos:", parentPosition, "top:", parentPosition.top, "left", parentPosition.left);
	//console.log("parent width:", parent[0].getBoundingClientRect().width);
	var popup = $(`<div style='width: auto; height: auto; position: absolute; top: ` + parentPosition.top + `px; left: ` +
	(parentPosition.left + parent[0].getBoundingClientRect().width / 2.0) + `px; display: none;' class="container-fluid popup"></div>`);
	$(document.body).append(popup);

	let closeBtnClone = $("#closeButtonTemp").clone();
	closeBtnClone.removeAttr('id');
	closeBtnClone.find(".btn-close").first().on('click', function(){destroyPopup(popupName);});
	closeBtnClone.find(".btn-drag").first().on('mousedown', function(e) {
		isDown = true;
		target = popup[0];
		offset = [
			popup[0].offsetLeft - e.clientX,
			popup[0].offsetTop - e.clientY
		];
	});
	popup.append(closeBtnClone);
	switch (type)
	{
		case "PnID-Valve_Servo":
			let newSlider = $("#sliderTemp").clone();
			newSlider.removeAttr("id");
			newSlider.find(".range-slider-label").first().text(name);
			popup.append(newSlider);
			break;
		case "PnID-Valve_Solenoid":
		case "PnID-Valve_Pneumatic":
			let newCheckbox = $("#digitalOutTemp").clone();
			newCheckbox.find(".ckbx-label").first().text(name).attr('for',popupName);
			newCheckbox.find("input").first().attr('id', popupName);
			popup.append(newCheckbox);
			break;
	}

	popup.fadeIn(100);

	rangeSlider();
	
	activePopups[popupName] = popup;
}

function destroyPopup(popupName)
{	
    activePopups[popupName].fadeOut(100, activePopups[popupName].remove);
	delete activePopups[popupName];
}

//if changes are made to an element while popup is open it might need to update values in the popup
function updatePopup()
{
	
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
		console.log("here");
        mousePosition = {

            x : event.clientX,
            y : event.clientY

        };
        target.style.left = (mousePosition.x + offset[0]) + 'px';
        target.style.top  = (mousePosition.y + offset[1]) + 'px';
    }
}, true);