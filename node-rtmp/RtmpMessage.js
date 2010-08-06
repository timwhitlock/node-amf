

var sys = require('sys');

var bin = require('../node-amf/bin');
var utils = require('../node-amf/utils');
var amf = require('../node-amf/amf');



// export single class
exports.RtmpMessage = RtmpMessage;



// utility to unpack numbers
var beParser = bin.parser( true, true );
var leParser = bin.parser( false, true );



/**
 * Constructor
 */
function RtmpMessage( data, messageLen ){
	// 4.1. messages begin with a type - dictates payload structure
	this.type = beParser.toByte( data.slice(0,1) );
	/*
	this.length = beParser.decodeInt( data.slice(1,4), 24, false );
	this.timestamp = beParser.decodeInt( data.slice(4,8), 32, false );
	this.streamId = leParser.decodeInt( data.slice(8,11), 24, false ); // <- BE/LE??
	this.payload = data.slice(11);
	*/
	
	// type 2: message is an AMF encoded command from the client
	// @todo test message type from chunk to determine AMF0/AMF3
	if( this.type === 2 ){
		// AMF payload is separated every 128 bytes by "0xC3"
		// todo optimize this, and check if needed for other types
		var message = '', i = 0;
		while( message.length < messageLen ){
			message += data.substr( i, 128 );
			i += 129;
		}
		var des = amf.deserializer( message.slice(1) );
		var cmd = des.readUTF8( amf.AMF0 );
		sys.puts('command = ' + cmd );
		var unknown = des.shiftBytes( 9 ); // <- ?
		sys.puts( 'unknown = '+utils.hex(unknown) );
		var obj = des.readValue( amf.AMF0 );
		sys.puts( sys.inspect(obj) );
	}
	
}