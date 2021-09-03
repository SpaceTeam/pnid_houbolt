const express = require("express");
const app = express();
var http = require('http').Server(app);
var fs = require('fs');

const bp = require('body-parser');
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

const path = __dirname + '/client/';
const pnidPath = path + "PnID_Franz.pnid";
const configPath = path + 'config/';

var port = 3000;

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
    //let rawdata = fs.readFileSync(pnidPath);
	res.sendFile(path + 'PnID_Franz.html')
});

app.get('/config/custom', (req, res) => {
    //let rawdata = fs.readFileSync(configPath + 'config.json');
	res.sendFile(configPath + 'config.json')
});

app.get('/config/default', (req, res) => {
    //let rawdata = fs.readFileSync(configPath + 'defaultConfig.json');
	res.sendFile(configPath + 'defaultConfig.json')
});

app.get('/config/thresholds', (req, res) => {
    //let rawdata = fs.readFileSync(configPath + 'thresholds.json');
	res.sendFile(configPath + 'thresholds.json')
});

//Big no no security wise
app.post('/pnid', (req, res) => {
    console.log(req.body);
    res.sendFile(path + req.body.file);
});

app.listen(port, function(err){
    if (err) console.log(err);
    console.log("Server listening on :", port);
});
