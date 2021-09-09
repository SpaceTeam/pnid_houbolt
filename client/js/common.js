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

function getElementValue(name, rawValue)
{
    let searchString = "text.value";
    if (rawValue === true)
    {
        searchString = "text.valueRaw";
    }
    return $(document).find(`g.${name}`).find(searchString).text();
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