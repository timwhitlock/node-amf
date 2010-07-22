/**
 * This is not a server.
 * This is simply a test script to ensure the node-amf libraries are working.
 * It will output some serialized AMF packets as hex dumps
 */

// require system libraries 
var sys = require('sys'); 

// require node-amf module libraries from relative directory path
var amf = require('./node-amf/amf');
var utils = require('./node-amf/utils');
var utf8 = require('./node-amf/utf8');



// initialize a new response packet
var Packet = amf.packet();

// add a simple header with a name and string value
Packet.addHeader( 'header 1', 'Example header' );

// create a construct containing various data types
var struct = { 
	strings: [ 'Hello World', '£' ], 
	numbers: [ Number.MIN_VALUE, -20000, -1, 0, 0.0123456, 2000000, 1234.5678, Number.MAX_VALUE, Number.NaN ], 
	objects: [ ,{}, ],
	others: [ true, false, null, undefined ]
};

// this is the standard requestURI that Flash would expect in a *response*
var requestURI = '/1/onResult';

// responseURI in this context is redundant @todo actually I'm confused about what this is
var responseURI = '/1';

// add construct as a single AMF message and return serialized, binary string
Packet.addMessage( struct, requestURI, responseURI ); 

// dump test packet in hex display
var bin = Packet.serialize();
sys.puts( utils.hex( bin ) );

// now attempt to deserialize the packet and get the data back
Packet = amf.packet( bin );
sys.puts( sys.inspect(Packet) );










