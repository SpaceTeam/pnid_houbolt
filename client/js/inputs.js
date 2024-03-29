//TODO: implement state update event properly with event dispatcher or so
function stateUpdate(stateName, value)
{
    if (typeof onPNIDInput === "undefined")
    {
        printLog("error", "onPNIDInput function not defined, ignoring input action of: " + stateName);
    }
    else
    {
        stateName = stateName.replaceAll("-",":");
        onPNIDInput(stateName, value, Date.now()*1000);
        printLog("info", "stateUpdate: " + stateName + " , value: " + value);
    }
}

function onServoSliderInput(servoSlider)
{
    let stateName = $(servoSlider).attr("state");
    if (stateName in activePopups)
    {
        deactiveInputUpdate(stateName, 15);
    }
    let newVal = parseFloat($(servoSlider).val());
    stateUpdate(stateName, newVal); //convert date now from milliseconds to micros
}

function onDigitalCheck(checkbox, action = undefined)
{
    let stateName = $(checkbox).attr("state");
    if (stateName in activePopups)
    {
        deactiveInputUpdate(stateName, 5);
    }
    //this will create true or false as value, but this is not really what we want, the state updates *receive* a number that is then mapped - do we have to make a "reverse mapping" where
    //for now we convert to 0 for false and 1 for true
    let newVal = checkbox.checked ? 1 : 0;
    stateUpdate(stateName, newVal);
    if (action != undefined)
    {
        eval(action);
    }
}

function onNumberInput(numberInput, action = undefined)
{
    let element = $(document).find(`#${numberInput}`);
    let stateName = element.attr("state");
    let newVal = parseFloat(element.val());
    //console.log("element", element);
    //console.log("element in", element.siblings().find("input.form-control"));
    element.siblings().find("input.form-control").addClass("uncommitted-highlight");
    element.prop("textColor", "#777777");

    stateUpdate(stateName, newVal);
    if (action != undefined)
    {
        eval(action);
    }
}

function onButtonInput(buttonVariable, action = undefined)
{
    stateUpdate(buttonVariable, 1);
    if (action != undefined)
    {
        eval(action);
    }
}