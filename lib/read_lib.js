
function read_lib(text) {
    var lines = text.split('\n');
    var lib = {};
    var i = 0;
    while (i < lines.length){
        if (/DEF/.test(lines[i]) && !/ENDDEF/.test(lines[i])) {
            var key = lines[i].split(" ")[1];
            var comp = [];
            var draw = false;
            while (i < lines.length){ //TODO change to appropiate value
                i++;
                if(!draw && /DRAW/.test(lines[i])){
                    draw = true;
                    continue;
                }
                if(draw){
                    if(/ENDDRAW/.test(lines[i])){
                        break; //Break after every shape is registered
                    }
                    const values = lines[i].split(" ");
                    if(/P/.test(values[0])){ //Polygon
                        var poly = {};
                        var numOfPoints = Number(values[1]);
                        var pointList = []
                        for (var j = 0; j < numOfPoints; j++) {
                            pointList.push(Number(values[5 + 2 * j]));
                            pointList.push(Number(values[6 + 2 * j]));
                        }
                        poly["type"] = "polygon";
                        poly["points"] = pointList;
                        comp.push(poly);
                    }
                    else if(/A/.test(values[0])) { //Arc
                        var arc = {};
                        arc["type"] = "arc";
                        arc["centerX"] = Number(values[1]);
                        arc["centerY"] = Number(values[2]);
                        arc["startX"] = Number(values[10]);
                        arc["startY"] = Number(values[11]);
                        arc["endX"] = Number(values[12]);
                        arc["endY"] = Number(values[13]);
                        if (Number(values[4]) + Number(values[5]) > 1800) { //determine if arc spans more than 180°
                            arc["largeArcFlag"] = 1;
                        } else {
                            arc["largeArcFlag"] = 0;
                        }
                        comp.push(arc);
                    }
                    else if(/S/.test(values[0])) { //Rectangle
                        var rect = {};
                        rect["type"] = "rectangle";
                        rect["startX"] = Number(values[1]);
                        rect["startY"] = Number(values[2]);
                        rect["endX"] = Number(values[3]);
                        rect["endY"] = Number(values[4]);
                        comp.push(rect);
                    }
                    else if(/X/.test(values[0])) { //Pin
                        var pin = {};
                        pin["type"] = "pin";
                        pin["x"] = Number(values[3]);
                        pin["y"] = Number(values[4]);
                        pin["length"] = Number(values[5]);
                        pin["orientation"] = values[6];
                        comp.push(pin);
                    }
                    else if(/C/.test(values[0])) { //Circle
                        var circle = {};
                        circle["type"] = "circle";
                        circle["centerX"] = Number(values[1]);
                        circle["centerY"] = Number(values[2]);
                        circle["radius"] = Number(values[3]);
                        comp.push(circle);
                    }
                    else if(/T/.test(values[0])) { //Text Field
                        var textField = {};
                        textField["type"] = "textField";
                        textField["posX"] = Number(values[2]);
                        textField["posY"] = Number(values[3]);
                        textField["text"] = values[8];
                        comp.push(textField);
                    }
                }
            }
            lib[key] = comp;
            i++
        }
        else{
            i++;
        }
    }
    
    return lib;
}

module.exports = read_lib;
