/**
 * Test RTMP socket - unstable - do not use
 */
var sys = require('sys');
var net = require('net');

var utils = require('../../node-amf/utils');
var amf = require('../../node-amf/amf');
var bin = require('../../node-amf/bin');
var pack = require('../../node-amf/pack').pack;
var unpack = require('../../node-amf/unpack').unpack;


var RtmpConnection = require('../../node-rtmp/RtmpConnection').RtmpConnection;



// Global variables
var server = net.createServer();


/** */
server.addListener('connection', function( socket ) {
	try {
		new RtmpConnection( socket );
	}
	catch( Er ){
		sys.puts('Error in server connect handler: '+Er.message );
	}
} );



/** */
server.addListener('close', function(errno) {
	sys.puts('server:close '+errno);
} );



server.listen( 1935, "192.168.51.6" );
sys.puts('Server ready');




// utility
function randomness( len ){
	var s = '';
	for( var i = 0; i < len; i++ ){
		 s += String.fromCharCode( Math.round( 255 * Math.random() ) );
	}
	return s;
}





