#!/usr/bin/node

const fs = require('fs');

const reader = require('./lib/read_schematic');
const libReader = require('./lib/read_lib');
const writer = require('./lib/write_schematic');
const htmlWriter = require('./lib/create_html');

const { inspect } = require('./lib/util');

const { set_defaults } = require('./lib/set_defaults');
const { generate_footprint } = require('./lib/generate_fields');

// Read schematic and Lib file
// Schematic file path needs to be passed as the first argument of the script, Lib file path as the second
const schematic = reader(
    fs.readFileSync(process.argv[2], 'utf-8'));
const lib = libReader(
    fs.readFileSync(process.argv[3], 'utf-8'));

const exportFilePath = "client/PnID_Franz.pnid";
if (process.argv.length > 4)
{
    exportFilePath = process.argv[4];
}

// Loop over all components and set default fields and values:
//schematic.Comp.forEach(set_defaults);

// Some components support generating footprint names from attributes:
//schematic.Comp.forEach(generate_footprint);

// Dump the whole thing to stdout:
//console.log(writer(schematic));


// Create html document displaying the kicad schematic
htmlWriter(schematic, lib, exportFilePath);

// inspect(schematic.Comp);
// inspect(default_fields);
