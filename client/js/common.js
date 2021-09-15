function checkStringIsNumber(string)
{
	// console.log(typeof string);
    if (typeof string == "string")
    {
        let re = /(^\d+$)|(^\d+\.\d*$)|(^\d*\.\d+$)/; //checks for either integer with only digits which are at beginning and end (one continuous string of digits) or 
                                                      //checks for float with either 1 or more digits followed by decimal point followed by 0 or more digits (3. or 3.04, but not .2), or
                                                      //0 or more digits followed by decimal point followed by 1 or more digits (.3 or 1.345, but not 2.)
        if (!re.test(string))
        {
            return false;
        }
    }
    else if (typeof string != "number")
    {
        printLog("warning", "Tried checking if a string is a number, but didn't receive a string nor number: " + string);
        return false;
    }
    return true;
}

function getElementValue(name, valueID)
{
    let searchString = `text.${valueID}`;
    return $(document).find(`g.${name}`).first().find(searchString).text();
}

function getElementAttrValue(name, attrName)
{
    return $(document).find(`g.${name}`).attr(attrName);
}

//I really dislike having this hardcoded to the n-th entry in the classes, but it's the quickest and safest way to do it right now.
function getReferenceFromClasses(classes)
{
    return classes[0];
}

function getTypeFromClasses(classes)
{
    return classes[1];
}

function getValReferenceFromClasses(classes)
{
    return classes[2];
}

function getConfigData(config, elementName, key)
{
    // get key (eval or popup) from default config structure
    if (elementName in config)
    {
        return config[elementName][key]
    }
    
    // if it's not found in default config it could be in custom config structure
    let categories = Object.keys(config);
    for (index in categories)
    {
        //printLog("info", "searching for state " + state["name"] + " from available states: " + config[configProperties[propIndex]]["states"]);
        if (config[categories[index]]["states"] != undefined)
        {
            if (config[categories[index]]["states"].includes(elementName)) //if the currently traversed property contains our state, check for eval
            {
                return config[categories[index]][key];
            }
        }
    }
    
    return undefined;
}