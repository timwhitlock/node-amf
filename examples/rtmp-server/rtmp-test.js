/**
 * Test RTMP socket - unstable - do not use
 */
var sys = require('sys');
var net = require('net');

var RtmpConnection = require('../../node-rtmp/RtmpConnection').RtmpConnection;



// Global variables
var server = net.createServer();


/** */
server.addListener('connection', function( socket ) {
	try {
		sys.puts('server.connection');
		new RtmpConnection( socket );
	}
	catch( Er ){
		sys.puts('Error in server connect handler: '+Er.message );
	}
} );



/** */
server.addListener('close', function(errno) {
	sys.puts('server.close '+errno);
} );



server.listen( 1935, "192.168.51.6" );
sys.puts('Server ready');
