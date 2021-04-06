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

var screenY = 1100; //TODO use better values for this
var screenX = 1600;

var maxX = Number.MIN_VALUE;
var minX = Number.MAX_VALUE;
var maxY = Number.MIN_VALUE;
var minY = Number.MAX_VALUE;

/**
 * Convert a schematic data structure to a KiCad readable file text.
 * @param  {Object}   schematic           Data structure
 * @param  {Function} content_manipulator Optional function to modify field
*                                         contents before quoting and writing.
 * @return {String}                       KiCad Schematic file content.
 */
 
 //command to start: node kicad-schematic-parser.js ../TXV_Teststand_PnID/PnID_GroßerTeststad.sch ../TXV_Teststand_PnID/PnID.lib
 
function create_html(schematic, lib, content_manipulator) {
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
        var h = `        <path d="M ${Math.round(startX + x)} ${Math.round(-startY + y)} `;
        for (var i = 2; i < pointList.length; i+=2) {
            [nextX, nextY] = convertCoordinates(pointList[i], pointList[i+1]);
            h += `L ${Math.round(nextX + x)} ${Math.round(-nextY + y)} `;
        }
        h += `" />\n`;
        return h;
    }
    function createArc(shape, x, y) {
        // Converting the coordinates from the kicad scheme to according coordinates in the svg file
        [startX, startY] = convertCoordinates(shape["startX"], shape["startY"]);
        [endX, endY] = convertCoordinates(shape["endX"], shape["endY"]);
        [centerX, centerY] = convertCoordinates(shape["centerX"], shape["centerY"]);
        var radius = Math.round(Math.sqrt((centerX - startX)**2 + (centerY - startY)**2));
        var h = `        <path d="M ${Math.round(startX + x)} ${Math.round(-startY + y)} A ${radius} ${radius} 0 ${shape["largeArcFlag"]} 0 ${Math.round(endX + x)} ${Math.round(-endY + y)}" />\n`;
        return h;
    }
    function createRectangle(shape, x, y) {
        [startX, startY] = convertCoordinates(shape["startX"], shape["startY"]);
        [endX, endY] = convertCoordinates(shape["endX"], shape["endY"]);
        startX = Math.round(startX + x);
        startY = Math.round(-startY + y);
        endX = Math.round(endX + x);
        endY = Math.round(-endY + y);
        if (startX > endX && startY > endY) {
            var h = `        <rect x="${endX}" y="${endY}" width="${startX - endX}" height="${startY - endY}" />\n`;
            return h;
        } else if (startX > endX && startY < endY) {
            var h = `        <rect x="${endX}" y="${startY}" width="${startX - endX}" height="${endY - startY}" />\n`;
            return h;
        } else if(startX < endX && startY > endY) {
            var h = `        <rect x="${startX}" y="${endY}" width="${endX - startX}" height="${startY - endY}" />\n`;
            return h;
        }
        var h = `        <rect x="${startX}" y="${startY}" width="${endX - startX}" height="${endY - startY}" />\n`;
        return h;
    }
    function createCircle(shape, x, y) {
        [centerX, centerY] = convertCoordinates(shape["centerX"], shape["centerY"]);
        pointX = shape["centerX"] + shape["radius"];
        [pointX, pointY] = convertCoordinates(pointX, shape["centerY"]);
        radius = Math.round(Math.sqrt((centerX - pointX)**2 + (centerY - pointY)**2));
        var h = `        <circle cx="${Math.round(centerX + x)}" cy="${Math.round(-centerY + y)}" r="${radius}" />\n`;
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
        var h = `        <path d="M ${Math.round(startX + x)} ${Math.round(-startY + y)} L ${Math.round(endX + x)} ${Math.round(-endY + y)}" />\n`;
        return h;
    }
    function createTextField(shape, x, y, orientationMatrix) { //TODO revert the transformation matrix so that the text orientation is correct
        [posX, posY] = convertCoordinates(shape["posX"], shape["posY"]);
        var h = `        <text x="${Math.round(x + posX)}" y="${Math.round(y - posY)}" dominant-baseline="middle" text-anchor="middle" `;
        //Revert some of the Rotations to display the sensor letters correctly
        if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == 1) { //Revert Rotate 180°
            h += `transform="rotate(180,${Math.round(x + posX)},${Math.round(y + posY)})"`
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == 1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Revert Rotate 90° right
            h += `transform="rotate(180,${Math.round(x + posX)},${Math.round(y - posY)})"`
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Revert Rotate 90° and mirror on X-axis
            h += `transform="scale(1,-1) translate(0,${(-2)*(y - posY)})"`
        } else if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == -1) { //Revert Mirror on Y-axis
            h += `transform="scale(-1,1) translate(${(-2)*(x + posX)},0)"`
        }
        h += `>${shape["text"]}<text>\n`
        return h;
    }
    function createTransformMatrices(orientationMatrix, x, y) {
        var h = "";
        if (orientationMatrix[0] == 1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == -1) { // no change
            h += "";
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == -1 && orientationMatrix[3] == 0) { // rotate -90° (left)
            h += `transform="rotate(-90,${Math.round(x)},${Math.round(y)})"`;
        } else if (orientationMatrix[0] == -1 && orientationMatrix[1] == 0 && orientationMatrix[2] == 0 && orientationMatrix[3] == 1) { //Rotation 180°
            h += `transform="rotate(180,${Math.round(x)},${Math.round(y)})"`;
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == 1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Rotation 90° (right)
            h += `transform="rotate(90,${Math.round(x)},${Math.round(y)})"`;
        } else if (orientationMatrix[0] == 0 && orientationMatrix[1] == -1 && orientationMatrix[2] == 1 && orientationMatrix[3] == 0) { //Rotation 90° (right) then mirror on X-axis
            h += `transform="rotate(90,${Math.round(x)},${Math.round(y)}) scale(1,-1) translate(0,${(-2)*y})"`;
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
        html = `    <g id="${comp.Reference}" stroke="black" fill="none" `; //TODO add class to the group
        html += createTransformMatrices(orientationMatrix, x, y) + ">\n";
        html += `        <!-- coordinates: x = ${x} y = ${y} -->\n`;
        
        for (var key in lib) {
            if (key == compName) {
                for (var i = 0; i < lib[key].length; i++) {
                    var shape = lib[key][i];
                    if (shape["type"] == "polygon") {
                        html += createPolygon(shape["points"],x,y);
                    } else if(shape["type"] == "arc") {
                        html += createArc(shape, x, y);
                    } else if(shape["type"] == "rectangle") {
                        html += createRectangle(shape, x, y);
                    } else if(shape["type"] == "circle") {
                        html += createCircle(shape, x, y);
                    } else if(shape["type"] == "pin") {
                        html += createPin(shape, x, y);
                    } else if(shape["type"] == "textField") {
                        text = createTextField(shape, x, y, orientationMatrix);
                    }
                }
            }
        }
        html += text;
        
        html += `    </g>\n`;
        return html;
    }
    function addText(comp) { // TODO: add all text elements and make sure that the orientation is correct, also maybe use input tags instead of text
        var f1 = comp.Fields.Value;
        if (Number(f1.dunno2) == 0) {
            [x,y] = convertCoordinates(Number(f1.x),Number(f1.y));
            if (/L/.test(f1.Horizontal_Position)) {
                var html = `        <text x="${Math.round(x)}" y="${Math.round(y)}" dominant-baseline="middle" text-anchor="start" style="font-size: 10px">${f1.content}</text>\n`;
            } else if(/R/.test(f1.Horizontal_Position)) {
                var html = `        <text x="${Math.round(x)}" y="${Math.round(y)}" dominant-baseline="middle" text-anchor="end" style="font-size: 10px">${f1.content}</text>\n`;
            } else {
                var html = `        <text x="${Math.round(x)}" y="${Math.round(y)}" dominant-baseline="middle" text-anchor="middle" style="font-size: 10px">${f1.content}</text>\n`;
            }
            return html;
        } else {
            return "";
        }
    }
    function addWires(w) {
        [x1, y1] = convertCoordinates(Number(w.x1),Number(w.y1));
        [x2, y2] = convertCoordinates(Number(w.x2),Number(w.y2));
        var h = "";
        if (w.category == "Wire"){
            h = `    <line x1="${Math.round(x1)}" y1="${Math.round(y1)}" x2="${Math.round(x2)}" y2="${Math.round(y2)}" stroke="red" />\n`;
        } else if (w.category == "Notes") {
            h = `    <line x1="${Math.round(x1)}" y1="${Math.round(y1)}" x2="${Math.round(x2)}" y2="${Math.round(y2)}" stroke="blue" stroke-dasharray="5,10" />\n`;
        }
        return h;
    }
    function addConnection(c) {
        [x,y] = convertCoordinates(Number(c.x), Number(c.y));
        var h = `    <circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="2" fill="green" />\n`
        return h;
    }
    
    function convertCoordinates(x,y) { //TODO make this function variable
        xFactor = screenX / 9800;
        yFactor = screenY / 6450;
        return [xFactor * x, yFactor * y];
    }
    
    var html = '<!doctype html>\n' +
    '<html>\n' + '<head>\n' + '    <title>PNID Chart</title>\n' + '</head>\n' + '<body>\n' + `<svg width="${screenX + screenX/10}" height="${screenY + screenY/5}">\n`;
    
    var text = `EESchema Schematic File Version ${schematic.version}\n`;

    schematic.LIBS.forEach(lib => { text += `LIBS:${lib}\n`; });

    schematic.EELAYER.forEach(l => {
        text += `EELAYER ${l.dunno1} ${l.dunno2}\n`;
    });
    text += "EELAYER END\n";

    text += `$Descr ${schematic.Descr.sheetFormat} ${schematic.Descr.x} ${schematic.Descr.y}\n`;
    schematic.Descr.forEach(prop => { text += `${prop.property} ${prop.value.join(' ')}\n`; });
    text += `$EndDescr\n`;

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
        
        html += addComponent(comp);
        html += addText(comp);
        //console.log(typeof comp.Fields.Value.dunno2);
    
        text += "$Comp\n";

        text += `L ${comp.Component_Name} ${comp.Reference}\n`;
        text += `U ${comp.dunno1} ${comp.dunno2} ${comp.Component_ID}\n`;
        text += `P ${comp.x} ${comp.y}\n`;

        var f;
        f = comp.Fields.Reference;
        text += `F ${0} ${proc_content(f.content)} ${f.orientation} ${f.x} ${f.y} ${f.Font_Size} ${f.dunno2} ${f.Horizontal_Position} ${f.Vertical_Position}\n`;
        f = comp.Fields.Value;
        text += `F ${1} ${proc_content(f.content)} ${f.orientation} ${f.x} ${f.y} ${f.Font_Size} ${f.dunno2} ${f.Horizontal_Position} ${f.Vertical_Position}\n`;
        f = comp.Fields.Footprint;
        text += `F ${2} ${proc_content(f.content)} ${f.orientation} ${f.x} ${f.y} ${f.Font_Size} ${f.dunno2} ${f.Horizontal_Position} ${f.Vertical_Position}\n`;
        f = comp.Fields.Datasheet;
        text += `F ${3} ${proc_content(f.content)} ${f.orientation} ${f.x} ${f.y} ${f.Font_Size} ${f.dunno2} ${f.Horizontal_Position} ${f.Vertical_Position}\n`;

        var i = 4;
        for (let prop in comp.Fields) {
            if (comp.Fields.hasOwnProperty(prop) && !(prop === "Reference" || prop === "Value" || prop === "Footprint" || prop === "Datasheet")) {
                f = comp.Fields[prop];
                text += `F ${i++} ${proc_content(f.content)} ${f.orientation} ${f.x} ${f.y} ${f.Font_Size} ${f.dunno2} ${f.Horizontal_Position} ${f.Vertical_Position} ${quote(prop)}\n`;
            }
        }
        
        comp.rest.forEach(item => {
            text += `    ${item.join(' ')}\n`;
        });

        text += "$EndComp\n";
    });


    schematic.Text.forEach(t => {
        text += `Text ${t.type} ${t.x} ${t.y} ${t.rotation} ${t.Font_Size} ${t.shape} ${t.dunno1} ${t.dunno2 || ""}\n${t.value}\n`;
    });
    
    html += '\n<!-- Wires-->\n\n';
    schematic.Wire.forEach(w => { // add wires
        text += `Wire ${w.category} ${w.type}\n    ${w.x1} ${w.y1} ${w.x2} ${w.y2}\n`;
        
        html += addWires(w);
    });

    html += '\n<!-- Connections-->\n\n';
    schematic.Connection.forEach(c => {
        text += `Connection ${c.dunno1} ${c.x} ${c.y}\n`;
        
        html += addConnection(c);
    });

    schematic.NoConn.forEach(nc => {
        text += `NoConn ${nc.dunno1} ${nc.x} ${nc.y}\n`;
    });

    text += "$EndSCHEMATC\n";

    html += '</svg>\n' + '</body>\n' + '</html>\n';
    
    fs.writeFile("PnID_GroßerTeststand", html, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    })
    
    console.log(minX)
    console.log(maxX)
    console.log(minY)
    console.log(maxY)

    fs.writeFile("test", text, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    })

    return text;
}

module.exports = create_html;
