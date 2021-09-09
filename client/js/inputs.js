//TODO: implement state update event properly with event dispatcher or so
function stateUpdate(stateName, value)
{
    if (typeof onPNIDInput === "undefined")
    {
        printLog("error", "onPNIDInput function not defined, ignoring input action of: " + stateName);
    }
    else
    {
        onPNIDInput(stateName, value, Date.now()*1000);
        printLog("info", "stateUpdate: " + stateName + " , value: " + value);
    }
}

function onServoSliderInput(servoSlider)
{
    let stateName = $(servoSlider).attr("state");
    let newVal = parseFloat($(servoSlider).val());
    stateUpdate(stateName, newVal); //convert date now from milliseconds to micros
}

function onDigitalCheck(checkbox)
{
    let stateName = $(checkbox).attr("state");
    //this will create true or false as value, but this is not really what we want, the state updates *receive* a number that is then mapped - do we have to make a "reverse mapping" where
    //for now we convert to 0 for false and 1 for true
    let newVal = checkbox.checked ? 1 : 0;
    stateUpdate(stateName, newVal);
}
