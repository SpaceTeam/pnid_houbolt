/**@file
 * @brief Write a KiCad schematic (.sch) based on a provided data structure.
 * @author Stefan Hamminga <stefan@prjct.net>
 * @copyright Copyright 2017 - Permission is hereby granted to redistribute this
 *            project according to the terms of the LGPL version 3 or higher.
 *
 * TODO: Replace all 'dunno' values.
 * TODO: Verify existing mappings.
 * TODO: Add hierargical sheet support
 */
const { quote, unquote } = require('./util');

const fs = require('fs');

var screenY = 8000; //TODO use better values for this
var screenX = 12000;

var maxX = Number.MIN_VALUE;
var minX = Number.MAX_VALUE;
var maxY = Number.MIN_VALUE;
var minY = Number.MAX_VALUE;

var count = 0;

/**
 * Convert a schematic data structure to a KiCad readable file text.
 * @param  {Object}   schematic           Data structure
 * @param  {Function} content_manipulator Optional function to modify field
*                                         contents before quoting and writing.
*  @param  {String}   exportFilePath      File path for generated svg
 * @return {String}                       KiCad Schematic file content.
 */
 
 //command to start: node kicad-schematic-parser.js ../TXV_Teststand_PnID/PnID_GroßerTeststand.sch ../TXV_Teststand_PnID/PnID.lib
 
function create_html(schematic, lib, exportFilePath, content_manipulator) {
    function proc_content(string) {
        if (typeof string === 'undefined') {
            string = "~";
        } if (string === true) {
            return quote("Y");
        } if (string === false) {
            return quote("N");
        } else {
            string = unquote(`${string}`);
            if (string.length < 1) string = "~";
        }
        if (typeof content_manipulator === 'function') {
            return quote(content_manipulator(string));
        }
        return quote(string);
    }
    
    function createPolygon(pointList,x,y) {
        [startX, startY] = convertCoordinates(pointList[0], pointList[1]);
        var h = `        <path d="M ${startX + x} ${-startY + y} `;
        for (var i = 2; i < pointList.length; i+=2) {
            [nextX, nextY] = convertCoordinates(pointList[i], pointList[i+1]);
            h += `L ${nextX + x} ${-nextY + y} `;
        }
        h += `" />\n`;
        return h;
    }
    function createArc(shape, x, y) {
        // Converting the coordinates from the kicad scheme to according coordinates in the svg file
        [startX, startY] = convertCoordinates(shape["startX"], shape["startY"]);
        [endX, endY] = convertCoordinates(shape["endX"], shape["endY"]);
        [centerX, centerY] = convertCoordinates(shape["centerX"], shape["centerY"]);
        var radius = Math.sqrt((centerX - startX)**2 + (centerY - startY)**2);
        var h = `        <path d="M ${startX + x} ${-startY + y} A ${radius} ${radius} 0 ${shape["largeArcFlag"]} 0 ${endX + x} ${-endY + y}" />\n`;
        return h;
    }
    function createRectangle(shape, x, y) {
        [startX, startY] = convertCoordinates(shape["startX"], shape["startY"]);
        [endX, endY] = convertCoordinates(shape["endX"], shape["endY"]);
        startX = startX + x;
        startY = -startY + y;
        endX = endX + x;
        endY = -endY + y;
        if (startX > endX && startY > endY) {
            var h = `        <rect class="rect" x="${endX}" y="${endY}" width="${startX - endX}" height="${startY - endY}" />\n`;
            return h;
        } else if (startX > endX && startY < endY) {
            var h = `        <rect class="rect" x="${endX}" y="${startY}" width="${startX - endX}" height="${endY - startY}" />\n`;
            return h;
        } else if(startX < endX && startY > endY) {
            var h = `        <rect class="rect" x="${startX}" y="${endY}" width="${endX - startX}" height="${startY - endY}" />\n`;
            return h;
        }
        var h = `        <rect class="rect" x="${startX}" y="${startY}" width="${endX - startX}" height="${endY - startY}" />\n`;
        return h;
    }
    function createCircle(shape, x, y) {
        [centerX, centerY] = convertCoordinates(shape["centerX"], shape["centerY"]);
        pointX = shape["centerX"] + shape["radius"];
        [pointX, pointY] = convertCoordinates(pointX, shape["centerY"]);
        radius = Math.sqrt((centerX - pointX)**2 + (centerY - pointY)**2);
        var h = `        <circle cx="${centerX + x}" cy="${-centerY + y}" r="${radius}" />\n`;
        return h;
    }
    function createPin(shape, x, y) {
        if (shape["orientation"] == "R") {
            var endX = shape["x"] + shape["length"];
            var endY = shape["y"];
        } else if (shape["orientation"] == "L") {
            var endX = shape["x"] - shape["length"];
            var endY = shape["y"];
        } else if (shape["orientation"] == "U") {
            var endX = shape["x"];
            var endY = shape["y"] + shape["length"]; 
        } else if (shape["orientation"] == "D") {
            var endX = shape["x"];
            var endY = shape["y"] - shape["length"];
        }
        [startX, startY] = convertCoordinates(shape["x"], shape["y"]);
        [endX, endY] = convertCoordinates(endX, endY);
        var h = `        <path d="M ${startX + x} ${-startY + y} L ${endX + x} ${-endY + y}" />\n`;
        return h;
    }
    function createTextField(shape, x, y, orientationMatrix) { //TODO revert the transformation matrix so that the text orientation is correct
        [posX, posY] = convertCoordinates(shape["posX"], shape["posY"]);
        var h = `        <text class="sensor-letter" x="${x + posX}" y="${y - posY}"`;
        //Revert some of the Rotations to display the sensor letters correctly
        if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == 1) { //Revert Rotate 180°
            h += ` transform="rotate(180,${x + posX},${y + posY})"`
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == 1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Revert Rotate 90° right
            h += ` transform="rotate(180,${x + posX},${y - posY})"`
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Revert Rotate 90° and mirror on X-axis
            h += ` transform="scale(1,-1) translate(0,${(-2)*(y - posY)})"`
        } else if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == -1) { //Revert Mirror on Y-axis
            h += ` transform="scale(-1,1) translate(${(-2)*(x + posX)},0)"`
        }
        h += `>${shape["text"]}</text>\n`
        return h;
    }
    function createTransformMatrices(orientationMatrix, x, y) {
        var h = "";
        if (orientationMatrix[0] == 1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == -1) { // no change
            h += "";
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == -1 && orientationMatrix[3] == 0) { // rotate -90° (left)
            h += `transform="rotate(-90,${x},${y})"`;
        } else if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == 1) { //Rotation 180°
            h += `transform="rotate(180,${x},${y})"`;
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == 1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Rotation 90° (right)
            h += `transform="rotate(90,${x},${y})"`;
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Rotation 90° (right) then mirror on X-axis
            h += `transform="rotate(90,${x},${y}) scale(1,-1) translate(0,${(-2)*y})"`;
        } else if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == -1) { //Mirror on Y-axis
            h += `transform="scale(-1,1) translate(${(-2)*x},0)"`
        }
        return h;
    }
    
    function addComponent(comp) {
        [x,y] = convertCoordinates(Number(comp.x), Number(comp.y));
        var text = "";
        var orientationMatrix = [Number(comp.rest[1][0]), Number(comp.rest[1][1]), Number(comp.rest[1][2]), Number(comp.rest[1][3])];
        var compName = comp.Component_Name.split(":")[1];
		var compValReference = comp.Fields.Value.content.split(":")[0];
        var unit = "";
        if (comp.Fields.Unit !== undefined) {
            unit = comp.Fields.Unit.content;
        }
        svg = `    <g class="${comp.Reference} ${comp.Component_Name.replace(":","-")} ${compValReference} comp" data-value="40" data-unit="${unit}" data-${comp.Component_Name.replace(":","-").toLowerCase()}="" pointer-events="bounding-box" onclick="clickEventListenever('${comp.Reference}', '${comp.Component_Name.replace(":","-")}', '${compValReference}')"`;
        svg += createTransformMatrices(orientationMatrix, x, y) + ">\n";
        svg += `        <!-- coordinates: x = ${x} y = ${y} -->\n`;
        
        for (var key in lib) {
            if (key == compName) {
                for (var i = 0; i < lib[key].length; i++) {
                    var shape = lib[key][i];
                    if (shape["type"] == "polygon") {
                        svg += createPolygon(shape["points"],x,y);
                    } else if(shape["type"] == "arc") {
                        svg += createArc(shape, x, y);
                    } else if(shape["type"] == "rectangle") {
                        svg += createRectangle(shape, x, y);
                    } else if(shape["type"] == "circle") {
                        svg += createCircle(shape, x, y);
                    } else if(shape["type"] == "pin") {
                        svg += createPin(shape, x, y);
                    } else if(shape["type"] == "textField") {
                        text = createTextField(shape, x, y, orientationMatrix);
                    }
                }
            }
        }
        svg += text;
        svg += addText(comp, orientationMatrix, x, y);
        svg += `    </g>\n`;
        
        return svg;
    }
        
    function createTextTransformMatrices(x, y, orientationMatrix) {
    	h = "";
    	if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == 1) { //Revert Rotate 180°
		    h += ` transform="rotate(180,${(x)},${(y)})"`;
		} else if (orientationMatrix[0] == 0 && orientationMatrix[1] == 1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Revert Rotate 90° right
		    h += ` transform="rotate(-90,${(x)},${(y)})"`
		} else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Revert Rotate 90° and mirror on X-axis
		    h += ` transform="rotate(90,${(x)},${(y)}) scale(1,-1) translate(0,${(-2)*(y)})"`;
		} else if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == -1) { //Revert Mirror on Y-axis
		    h += ` transform="scale(-1,1) translate(${(-2)*(x)},0)"`;
		} else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == -1 && orientationMatrix[3] == 0) { //Revert Rotate -90° left
		    h += ` transform="rotate(90,${(x)},${(y)})"`;
		}
		return h
    }
    
    function addText(comp, orientationMatrix, compX, compY) { // TODO: add all text elements and make sure that the orientation is correct, also maybe use input tags instead of text
        var f0 = comp.Fields.Reference
        var f1 = comp.Fields.Value;
        var html="";
        var visibility
        if (Number(f0.dunno2) == 0) {
            visibility = "visible";
        } else {
            visibility = "hidden";   
        }
        [x,y] = convertCoordinates(Number(f0.x),Number(f0.y));
        y = y - 2*(y-compY);
        html += `        <text class="reference" x="${(x)}" y="${(y)}" visibility="${visibility}"`;
        html += createTextTransformMatrices(x,y,orientationMatrix);
        html += `>${f0.content}</text>\n`;
        
        if (Number(f1.dunno2) == 0) {
            visibility = "visible";
        } else {
            visibility = "hidden";
        }
        [x,y] = convertCoordinates(Number(f1.x),Number(f1.y));
        y = y - 2*(y-compY);
        html += `        <text class="value" x="${(x)}" y="${(y)}" visibility="${visibility}"`;
        html += createTextTransformMatrices(x,y,orientationMatrix);
        html += `>${f1.content}</text>\n`;
        
        for (let prop in comp.Fields) {
            if (comp.Fields.hasOwnProperty(prop) && !(prop === "Reference" || prop === "Value" || prop === "Footprint" || prop === "Datasheet")) {
                f = comp.Fields[prop];
                if (Number(f.dunno2) == 0) {
                    visibility = "visible";
                } else {
                    visibility = "hidden";
                }
                [x,y] = convertCoordinates(Number(f.x), Number(f.y));
                y = y - 2 * (y-compY);
                html += `        <text class="${prop}" x="${(x)}" y="${(y)}" visibility="${visibility}"`;
                html += createTextTransformMatrices(x,y,orientationMatrix);
                html += `>${f.content}</text>\n`;
            }
        }
        
        return html;
    }
    
    function addNoteLines(w) {
        [x1, y1] = convertCoordinates(Number(w.x1),Number(w.y1));
        [x2, y2] = convertCoordinates(Number(w.x2),Number(w.y2));
        var h = "";
        h = `    <line class="note-line" x1="${(x1)}" y1="${(y1)}" x2="${(x2)}" y2="${(y2)}" />\n`;
        return h;
    }
    
    function searchSiblings(arr, x1, y1, x2, y2){
        var group = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == undefined) {
                continue;
            }
            if ((arr[i][0] == x1 && arr[i][1] == y1) || (arr[i][2] == x1 && arr[i][3] == y1) ||
            (arr[i][0] == x2 && arr[i][1] == y2) || (arr[i][2] == x2 && arr[i][3] == y2)) {
                group.push(arr[i]);
                count += 1;
                delete arr[i];
            }
        }
        if (group.length == 0) {
            return group;
        }
        for (var i = 0; i < group.length; i++) {
            group = group.concat(searchSiblings(arr, group[i][0], group[i][1], group[i][2], group[i][3]));
        }
        return group;
    }
    
    function getLineGroups(arr) {
        var groupList = []
        while (arr.length > 0) {
            var start = arr[0];
            delete arr[0];
            count += 1;
            var group = [start];
            group = group.concat(searchSiblings(arr, start[0],start[1],start[2],start[3]));
            groupList.push(group);
            for (var i = arr.length - 1; i >= 0; i--) {
                if (arr[i] == undefined) {
                    arr.splice(i, 1);
                }
            }
        }
        return groupList;
    }
    
    function getLineGroupClass(group, textLabels) {
        var s = "";
        group.forEach(line => {
            for (var i = 0; i < textLabels.length; i++) {
                if((line[0] == textLabels[i][0] && line[1] == textLabels[i][1]) || (line[2] == textLabels[i][0] && line[3] == textLabels[i][1])) {
                    s = textLabels[i][2];
                }
            }
        });
        return s;
    }
    
    function addLineGroup(group) {
        var s = getLineGroupClass(group, textLabels);
		s = s.replace("\r", ""); //apparently when run on windows it adds carriage returns
        if (s == "") {
            var h = `    <g class="wire" data-pnid-wire="">\n`;
        } else {
            var h = `    <g class="${s} wire" data-pnid-wire="">\n`;
        }
        group.forEach(line => {
            [x1, y1] = convertCoordinates(line[0],line[1]);
            [x2, y2] = convertCoordinates(line[2],line[3]);
            h += `        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />\n`;
        });
        h += `    </g>\n`;
        return h;
    }
    
    function addConnection(c) {
        [x,y] = convertCoordinates(Number(c.x), Number(c.y));
        var h = `    <circle cx="${(x)}" cy="${(y)}" r="2" fill="green" />\n`
        return h;
    }
    
    function convertCoordinates(x,y) { //function no longer necessary, since x,y values are no longer converted, instead the svg file is scaled down
        //xFactor = screenX / 9800;
        //yFactor = screenY / 6450;
        //return [xFactor * x, yFactor * y];
        return [x,y];
    }
    
    //+ `<svg width="${screenX + screenX/10}" height="${screenY + screenY/5}">\n`
    
    schematic.Comp.forEach(comp => {
        if(maxX < Number(comp.x)) {
            maxX = Number(comp.x);
        }
        if(minX > Number(comp.x)) {
            minX = Number(comp.x);
        }
        if(maxY < Number(comp.y)) {
            maxY = Number(comp.y);
        }
        if(minY > Number(comp.y)) {
            minY = Number(comp.y);
        }
        
    });
    
    var xBorder = (maxX - minX) / 20;
    var yBorder = (maxY - minY) / 20;
    
    var svg = '<svg style="position: absolute; top=0; left=0;" viewBox="${minX - xBorder} ${minY - yBorder} ${maxX + xBorder} ${maxY + yBorder}">\n';
    
    svg += '\n<!-- Components -->\n\n';
    
    schematic.Comp.forEach(comp => {
        svg += addComponent(comp);
    });
    
    svg += '\n<!-- Wires-->\n\n';
    
    var wires = []
    var j = 0;
    for (var i = 0; i < schematic.Wire.length; i++) {
        if (schematic.Wire[i].category == "Wire") {
            wires[j] = [Number(schematic.Wire[i].x1), Number(schematic.Wire[i].y1), Number(schematic.Wire[i].x2), Number(schematic.Wire[i].y2)];
            j ++;
        }
    }
    
    var textLabels = [];
    schematic.Text.forEach(t => {
        if (t.type == "Label") {
            textLabels.push([Number(t.x), Number(t.y), t.value]);
        }
    });
    
    var lineGroups = getLineGroups(wires);
    lineGroups.forEach(group => {
        svg += addLineGroup(group, textLabels);
    });
    
    schematic.Wire.forEach(wire => {
        if (wire.category == "Notes"){
            svg += addNoteLines(wire);
        }
    });
    
    svg += '\n<!-- Connections-->\n\n';
    
    schematic.Connection.forEach(c => {
        svg += addConnection(c);
    });
    
    svg += '</svg>\n';
    
    fs.writeFile(exportFilePath, svg, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
    

    return "";
}

module.exports = create_html;
