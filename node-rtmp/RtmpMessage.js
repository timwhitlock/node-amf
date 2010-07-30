

var sys = require('sys');

var bin = require('../node-amf/bin');
var utils = require('../node-amf/utils');
var amf = require('../node-amf/amf');



// export single class
exports.RtmpMessage = RtmpMessage;



// utility to unpack numbers
var binParser = bin.parser( true, true );



/**
 * Constructor
 */
function RtmpMessage( data ){
	// 4.1. messages have a fixed header of 11 bytes
	this.type = binParser.toByte( data.slice(0,1) );
	this.length = binParser.decodeInt( data.slice(1,4), 24, false );
	this.timestamp = binParser.toDWord( data.slice(4,8) );
	this.streamId = binParser.decodeInt( data.slice(8,11), 24, false );
	this.payload = data.slice(11);
	//sys.puts( utils.hex( this.payload ) );
	//var Des = amf.deserializer( this.payload );
	
}