/**
 * @summary Checks if a string can be cast properly to a number.
 * @description Checks whether the input was actually a string. If it was, tests against a regex to see if that string contains only numbers. Fancy formats like 13e6 and the like are not supported.
 * @param {(string|number)} string The string that should be checked. Can also be a number, in which case it will simply return true as obviously a number is a number. This behavior relies on implicit casting of JS.
 * @return {boolean} True if the string correctly validates to a number (or if the variable is already a number), false if it's a string containing something other than a number in the allowed formats, or if the variable wasn't a string to begin with.
 */
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

/**
 * @typedef {Object} ElementBuffer
 * @property {string} valueReference The key / ID of the buffer.
 * @property {Object} elements Content of the buffer for element with ID "valueReference".
 * @property {jQuery} elements.parent jQuery object of the entire pnid element that got buffered.
 * @property {jQuery} elements.wire jQuery object of all wires of the same name.
 * @property {jQuery} elements.value jQuery object of the value element (child of the "parent" pnid element) that got buffered. Not in use for {@link __actionReferenceBuffer}.
 * @property {jQuery} elements.valueRaw jQuery object of the valueRaw element (child of the "parent" pnid element) that got buffered. Not in use for {@link __actionReferenceBuffer}.
 * @property {jQuery} elements.actionReferenceValue jQuery object of the actionReferenceValue element (child of the "parent" pnid element) that got buffered. Not in use for {@link __elementGroupBuffer}.
 * @property {jQuery} elements.actionReferenceValueRaw jQuery object of the actionReferenceValueRaw element (child of the "parent" pnid element) that got buffered. Not in use for {@link __elementGroupBuffer}.
 * @see __elementGroupBuffer
 * @see __actionReferenceBuffer
 * @example "state_name": { "parent": Object.<jQuery>, "wire": Object.<jQuery>, "value": Object.<jQuery>}
 */

/**
 * @summary The buffer of all "normal" pnid elements.
 * @type ElementBuffer
 * @example //Usually either value[Raw] or actionReferenceValue[Raw] are set, not both at the same time.
 * "state_name": { "parent": Object.<jQuery>, "wire": Object.<jQuery>, "value": Object.<jQuery>, "valueRaw": Object.<jQuery>}
 * "other_name": { "parent": Object.<jQuery>, "actionReferenceValue": Object.<jQuery>, "actionReferenceValueRaw": Object.<jQuery>}
 */
var __elementGroupBuffer = {};
var __emptyObject = $.find("#non-existant-id-that-will-definitely-return-an-empty-object"); //I hate everything about this

/**
 * @summary Clears the element buffer.
 * @description On switching PNID it might be needed to clear the buffer to not keep possible "ghost elements" (buffered from the previous PNID) that may cause buffer collisions.
 */
function clearElementBuffer()
{
    __elementGroupBuffer = {};
}

/**
 * @summary Loads an (svg g) element from DOM into a buffer.
 * @description Utilizes jQuery.find() for finding elements, stores them in a buffer for later use to not need as much CPU time traversing the DOM.
 * @param {ElementBuffer} A dictionary of buffered elements.
 * @param {string} identifier The main identifier of the svg group.
 * @param {string} [subidentifier=parent] Optionally possible to define a sub identifier that can select elements inside of an svg group. Commonly used identifiers are "value", "valueRaw", "actionReferenceValue" and "actionReferenceValueRaw". "Special" identifiers are "parent" (default behavior if not specified) which returns the entire element including all sub elements which could be accessed by the sub identifiers and "wire" which returns all wires that fit the query instead of components.
 * @return {jQuery} The matched element (or elements) as jQuery elements.
 */
function storeElementInBuffer(identifier, subidentifier = "parent")
{
    let isActionReference = false;
    let element = undefined;
    let elementExists = true;
    if (subidentifier == "parent" || subidentifier == "wire")
    {
        let filterString = "comp";
        if (subidentifier == "wire")
        {
            filterString = "wire";
        }
        //console.error("cache miss", identifier);
        element = $(document).find(`g.${identifier}.${filterString}`);
        if (element.length == 0) // if no result, try if it may be an action reference
        {
        	//console.error("action reference cache miss", identifier);
            element = $(document).find(`g[action-reference='${identifier}']`);
            if (element.length == 0) //if there was still no result return because nothing was found and we don't want to create an empty buffer entry
            {
            	elementExists = false;
                //TODO not sure whether to return element (which is empty) or undefined at this point.
            }
            else
            {
            	isActionReference = true;
            }
        }
        try { //try to directly set it. will fail if [subidentifier] key does not exist yet, but it might if parent/wire has already been called once
        	if (elementExists)
        	{
        		__elementGroupBuffer[identifier][subidentifier] = element;
        	}
        	else
        	{
        	//console.error("setting cache to null");
        		__elementGroupBuffer[identifier][subidentifier] = null;
        	}
        } catch (error) {
            let newElement = {};
            if (elementExists)
            {
            	newElement[subidentifier] = element;
            }
            else
            {
            	newElement[subidentifier] = null;
            }
            __elementGroupBuffer[identifier] = newElement;
        }
        __elementGroupBuffer[identifier]["isActionReference"] = isActionReference; //could move that in the "catch" part as well as it should only be needed once when the subidentifier is added, but it doesn't hurt if it's out here and if code structure changes maybe the behavior changes as well to make this needed here. just more robust at the cost of a single assignment more.
    }
    else
    {
        let rootEl = getElement(identifier, "parent");
        if (rootEl.length != 0) //should only happen when searching for subidentifier "setState"
        {
            element = getElement(identifier, "parent").find(`text.${subidentifier}`);
            __elementGroupBuffer[identifier][subidentifier] = element;
        }
        else
        {
            __elementGroupBuffer[identifier][subidentifier] = null;
        }
        
    }
    return element;
}

/**
 * @summary Returns whether an element with a certain identifier is an action reference or not.
 * @description Executes {@link getElement} to make sure the element in question is actually in the buffer, otherwise it might return wrong values if the element in question exists but was never loaded yet. Then checks the field "isActionReference" that gets written to on first load into buffer and returns its value.
 * @param {string} identifier The main identifier of the svg group.
 * @return {boolean} Whether or not the specified element identifier (value reference) is an action reference or not. Returns undefined if the element can't be found.
 */
function getIsActionReference(identifier)
{
    let result = undefined;
    getElement(identifier); //this is shitty, but "needed" so I can make sure that I actually return the right thing and don't return "this element doesn't exist" even though it maybe does but just wasn't buffered yet.
    try {
        result = __elementGroupBuffer[identifier]["isActionReference"];
    } catch (error) {
        result = undefined;
    }
    return result;
}

/**
 * @summary Finds an (svg g) element in DOM.
 * @description Reads from the appropriate buffer based on isActionReference. Will only return "comp" elements unless subidentifier is set to "wire" in which case it searches for wire groups. If query is not stored in a buffer yet, utilizes {@link storeElementInBuffer} for finding and storing them. Using buffers drastically reduces CPU time traversing the DOM.
 * @param {string} identifier The main identifier of the svg group.
 * @param {string} [subidentifier=parent] Optionally possible to define a sub identifier that can select elements inside of an svg group. Value "parent" is for selecting the main svg group. Commonly used identifiers are "value" and "valueRaw". If isActionReference is set to true, "value" and "valueRaw" are "actionReferenceValue" and "actionReferenceValueRaw". "Special" identifiers are "parent" which returns the entire element including all sub elements which could be accessed by the sub identifiers and "wire" which returns all wires that fit the query instead of components.
 * @todo Evalute whether split buffers for action references and normal elements is actually needed. This also ties in with the documentation of this function - technically isActionReference doesn't do anything about value vs actionReferenceValue, so the docs are kind of misleading here.
 * @return {jQuery} The matched element (or elements) as jQuery elements.
 */
function getElement(identifier, subidentifier = "parent")
{
    let element = undefined;
    let findInDOM = false;
    try {
        element = __elementGroupBuffer[identifier][subidentifier];
        if (element === undefined)
        {
            //if it's undefined an element with the same identifier (but different sub identifier) has already been found - we still need to search DOM
            findInDOM = true;
        }
    } catch (error) {
        //if it throws an error no element with this identifier was found in cache -> search for it in DOM
        findInDOM = true;
    }
    if (findInDOM)
    {
        //console.log("cache miss, searching for '" + identifier + "' '" + subidentifier + "'");
        element = storeElementInBuffer(identifier, subidentifier);
    }
    else
    {
        //console.log("cache hit for", identifier, subidentifier);
    }
    if (element === null)
    {
    	return __emptyObject;
    }
    return element;
}

/**
 * @summary Get content of a text field from element with certain name.
 * @description Uses {@link getElement} to find the appropriate element, then extracts the needed information with jQuery.
 * @param {string} valueReference The main identifier of the svg group.
 * @param {string} valueID Which text field to extract information from. For example "value" or "actionReferenceValueRaw"
 * @return {string} The value of the text field.
 */
function getElementValue(valueReference, valueID)
{
    let element = getElement(valueReference, valueID);
    if (element == undefined || element.length == 0)
    {
        //consider removing this warning or changing it up, this is now legitimate behavior thanks to getElementValue(id, "setState")
        printLog("warning", `Tried getting element for extracting value, but couldn't find element ${valueID} in element with value reference ${valueReference}!`);
        return undefined;
    }
    return element.text();
}

/**
 * @summary Get value of a certain attribute of a pnid element.
 * @description Uses {@link getElement} to find the appropriate element, then extracts the needed information with jQuery.
 * @param {string} valueReference The main identifier of the svg group.
 * @param {string} attrName Which attribute value to return.
 * @return {string} The value of the attribute.
 * @todo This doesn't find wires where the previous implementation of it did. I think this is fine, but I'm not entirely sure.
 */
function getElementAttrValue(valueReference, attrName)
{
    let element = getElement(valueReference);
    if (element == undefined || element.length == 0)
    {
        element = getElement(valueReference, "wire");
        if (element == undefined || element.length == 0)
        {
            //console.log("tried getting attr value for wire, ignoring");
            return undefined;
        }
        printLog("warning", `Tried getting attribute ${attrName}, but couldn't find element with value reference ${valueReference}!`);
        return undefined;
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
    // get key (eval or popup) from config structure like the custom config has
    let categories = Object.keys(config);
    for (index in categories)
    {
        //printLog("info", "searching for state " + elementName + " from available states: " + config[categories[index]]["states"]);
        if (config[categories[index]]["states"] != undefined)
        {
            if (config[categories[index]]["states"].includes(elementName)) //if the currently traversed property contains our state, check for eval
            {
                if (config[categories[index]][key] != undefined) //only return if the config entry that's found actually has this key set. usually this should be the case, but in some cases having the eval and popup custom configs in different entries is helpful, so we have to continue searching if we didn't find the key in question in the first entry for this element name. This can lead to searching for longer than needed if the config isn't set up properly, but I can live with that.
                {
                    return config[categories[index]][key];
                }
            }
        }
    }

    // if it's not in the custom config, get key (eval or popup) from default config structure
    if (elementName in config) //TODO this is kind of buggy, if the custom config contains an object with name identical to the state name (which is not needed, the first order names in custom config are completely irrelevant and just for human readable commenting) this will incorrectly identify it as the default config. this is why the searching through custom config is now before default config, however even then it can still lead to issues (if something is not found in the custom config format, aka it doesn't exist, it then may incorrectly be detected as being in the default config format. however this shouldn't be a problem in the vast majority of cases. not sure how to fix it without passing a bool/config name or hardcoding custom and default config variables. investigate
    {
        return config[elementName][key];
    }
    
    return undefined;
}
