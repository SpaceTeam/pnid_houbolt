var pinnedPopups = {};
var activePopups = {};

function clickEventListenever(dispReference, dispType, dispValReference)
{
	console.log(dispReference, dispValReference);
	let popupName = dispType + "_" + dispValReference;
	if (!(popupName in activePopups))
	{
		showPopup(dispReference, dispType, dispValReference);
	}
}

//choose popup behavior to display, hand off data to createPopup
function showPopup(dispReference, dispType, dispValReference)
{
	if (dispType in defaultConfig)
	{
		if ("popup" in defaultConfig[dispType])
		{
			console.log("found popup behavior");
			popupData = defaultConfig[dispType]["popup"].split(":"); //todo: this supports only one item per popup, need to expand with a line/item delimiter
			popupParent = $(document).find("g." + dispReference + "." + dispType + "." + dispValReference);
			createPopup(popupParent, dispType, dispValReference, popupData);
		}
		
	}
}

//create the actual html elements for the popup
function createPopup(parent, type, name, contentList)
{
	let parentPosition = parent.offset();
	//let parentPosition = parent.getBoundingClientRect();
	console.log(parent);
	console.log("parentpos:", parentPosition, "top:", parentPosition.top, "left", parentPosition.left);
	console.log("parent width:", parent[0].getBoundingClientRect().width);

	var popup = $(`<div style='position: absolute; top: ` + parentPosition.top + `px; left: ` +
	(parentPosition.left + parent[0].getBoundingClientRect().width / 2.0) + `px; display: none;' class="popup"><button class="popup-close" id="fill" onclick="destroyPopup($(this))">X</button><div class="heading">` +
	name + `</div></div>`);
	$(document.body).append(popup);
	popup.fadeIn(50);

	//replace the id with the one it should have
	var newid = type + "_" + name;  
	console.log(newid)
	$(".popup-close").each(function(i){
		if(this.id =="fill"){
			this.id = newid;
		}
	});
	activePopups[type + "_" + name] = popup;
}

function destroyPopup(popupName)
{
	let id = popupName.attr('id');	
	console.log(activePopups[popupName]);
	//console.log("popup:", activePopups[popupName], "filtered for visible:", activePopups[popupName].filter(":visible"));
	//activePopups[popupName].fadeOut(2000/*, activePopups[popupName].remove()); 
	//activePopups[popupName].fadeOut(2000, console.log("fade out complete"));
	activePopups[id].remove();
	delete activePopups[id];
}

function pinPopup()
{
	
}

//need an unpin popup or can this be done via destroy?

//if changes are made to an element while popup is open it might need to update values in the popup
function updatePopup()
{
	
}