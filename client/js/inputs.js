function onServoSliderInput(servoSlider)
{
    let stateName = $(servoSlider).attr("state");
    let newVal = $(servoSlider).val();
    let stateUpdate = {"name": stateName, "value": newVal};
    printLog("info", stateUpdate);
}

function onDigitalCheck(checkbox)
{
    let stateName = $(checkbox).attr("state");
    let newVal = $(checkbox).prop("checked");
    let stateUpdate = {"name": stateName, "value": newVal};
    //this will create true or false as value, but this is not really what we want, the state updates *receive* a number that is then mapped - do we have to make a "reverse mapping" where
    // eg true = 100 and false = 0, a default mapping (truthy values = 1, non-truthy = 0?) or just send true and false and let the LLServer deal with it?
    printLog("info", stateUpdate);
}
