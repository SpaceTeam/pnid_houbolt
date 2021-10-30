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

var __elementGroupBuffer = {};
var __actionReferenceBuffer = {};

/**
 * @summary Finds an (svg g) element in DOM.
 * @description Utilizes jQuery.find() for finding initial elements, but buffers them for later use to not need as much CPU time traversing the DOM.
 * @param {string} identifier The main identifier of the svg group.
 * @param {string} [subidentifier=parent] Optionally possible to define a sub identifier that can select elements inside of an svg group. Value "parent" is for selecting the main svg group.
 * @param {bool} [isActionReference=false] Optionally define whether the element that is searched for belongs to an action reference or not. Default is false which searches "normally".
 * @todo Evalute whether split buffers for action references and normal elements is actually needed.
 * @return {jQuery} The matched element (or elements) as jQuery elements.
 */
function getElement(identifier, subidentifier = "parent", isActionReference = false)
{
    let buffer = undefined;
    if (isActionReference) //TODO evaluate the split buffer stuff here
    {
        buffer = __actionReferenceBuffer;
    }
    else
    {
        buffer = __elementGroupBuffer;
    }
    let element = undefined;
    let findInDOM = false;
    try {

        element = buffer[identifier][subidentifier];
        if (element == undefined)
        {
            findInDOM = true;
        }
    } catch (error) {
        findInDOM = true;
    }
    if (findInDOM)
    {
        if (subidentifier == "parent")
        {
            if (isActionReference)
            {
                element = $(document).find(`g[action-reference='${identifier}']`);
            }
            else
            {
                element = $(document).find(`g.${identifier}`);
            }
            buffer[identifier] = {"parent": element};
        }
        else
        {
            element = getElement(identifier, "parent").find(`text.${subidentifier}`);
            buffer[identifier][subidentifier] = element;
        }
    }
    return element;
}

function getElementValue(name, valueID)
{
    let searchString = `text.${valueID}`;
    let element = undefined;
    try {
        element = __elementGroupBuffer[name]["parent"];
    } catch (error) {
        element = $(document).find(`g.${name}`).first();
        __elementGroupBuffer[name] = {"parent": element};
    }
    return element.find(searchString).text();
}

function getElementAttrValue(name, attrName)
{
    let element = undefined;
    try {
        element = __elementGroupBuffer[name]["parent"];
    } catch (error) {
        element = $(document).find(`g.${name}`);
        __elementGroupBuffer[name] = {"parent": element};
    }
    return element.attr(attrName);
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
