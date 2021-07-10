const express = require("express");
const app = express();
var http = require('http').Server(app);
const path = __dirname + '/client/';


var port = 80;

// Search for argument port= in node cli arguments
process.argv.forEach(arg => {
    if(arg.startsWith("port=")){
        var reqPort = arg.slice(arg.indexOf("=") + 1);
        reqPort = Number.parseInt(reqPort);
        
        // check validity of requested port
        if(reqPort >= 0 && reqPort <= 65353) port = reqPort;
        else console.log(arg + " doesn't include a valid port number, using default port instead: " + port);
    }
  });

port = process.env.PORT || port;

app.use(express.static(path));


app.get('/', (req, res) => {
	res.sendFile(path + 'PnID_GroßerTeststand.html')
});

app.listen(port, function(err){
    if (err) console.log(err);
    console.log("Server listening on :", port);
});
